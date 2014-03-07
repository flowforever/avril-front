/// <reference path="../../scripts/_references.js" />
/*
* avril mvc framework hardly dependency on Backbone.js and Knockout.js 
* please ensure you have referenced this two scripts
*/
(function ($) {

    //#region config 

    var config = avril.namespace('avril.mvc.config');

    var configUrl = '/resources/config';

    $.extend(config, {
        templateUrl: '/resources/template'
        , release: false
        , configUrl: configUrl
        , defaultLoadData: false
    });

    /* load config from server */
    config.load = function (urlOrData) {
        var merge = function (data) {
            $.extend(avril.mvc.config, data);
        }
            , load = function (data) {
                data = data || {};
                data.requestReady = true;
                merge(data);
                avril.mvc.config.onload([avril.mvc.config]);
            };
        if (typeof urlOrData === 'string') {
            config.configUrl = urlOrData;
            $.getJSON(urlOrData.configUrl, load);
        } else {
            if (urlOrData && typeof (urlOrData) == 'object') {
                merge(urlOrData);
                if (urlOrData.configUrl) {
                    $.getJSON(urlOrData.configUrl, load);
                } else {
                    load(urlOrData);
                }
            } else {
                $.getJSON(config.configUrl, load);
            }
        }
    };

    /* in your method you could manually call onload method */
    config.onload = function (func) {
        if (config.requestReady) {
            typeof func == 'function' ? func() : avril.event.get('avril.mvc.config.onload')(func);
        }
        else {
            avril.event.get('avril.mvc.config.onload')(func);
        }
    };
    config.onload(function (config) {
        var oldVersion = avril.tools.cache('version');
        if (oldVersion != config.version) {
            avril.tools.cache('version', config.version);
            avril.mvc.config.onVersionChange([oldVersion, config.version]);
        }
    });

    /* make it easy for some method may depend on config loaded , 
    you don't need too much callback, you just need to wrap the methods that need config data
    when config loaded execute methods */
    config.ensure = function (obj, funcs) {
        var funcArr = funcs.split(',');
        funcArr.each(function (funcName) {
            if (typeof (obj[funcName]) == 'function') {
                var func = obj[funcName];
                function execFunc(args) {
                    obj[funcName] = func;
                    return func.apply(obj, args);
                }
                obj[funcName] = function () {
                    var args = arguments;
                    if (config.requestReady) {
                        return execFunc(args);
                    } else {
                        config.onload(function () {
                            execFunc(args);
                        });
                    }
                };
            }
        });
    }

    /*do some special things when the version is changed*/
    config.onVersionChange = avril.event.get('avril.mvc.config.onVersionChange');

    //#endregion

    //#region models
    (function () {
        var pools = {
            '0__hashkey': avril.getHash({})
        };

        var getPool = function (poolName, parentPool) {

            poolName = poolName || avril.getHash({});

            if (pools[poolName]) {
                return pools[poolName];
            }

            var pool = pools[poolName] = {
                __hashkey: avril.getHash({})
                , _models: {}
                , model: function (name, model) {
                    if (!name) { return undefined; }
                    var _models = this._models;;
                    if (!_models[name]) {
                        arguments.length == 1 && (_models[name] = ko.observable());
                        !(model instanceof Array) && arguments.length == 2 && (_models[name] = ko.observable(model));
                        (model instanceof Array) && arguments.length == 2 && (_models[name] = ko.observableArray(model));
                    } else {
                        arguments.length == 2 && (_models[name](model));
                    }
                    return _models[name];
                }
                , parentPool: parentPool
                , getPool: function (name) {
                    return getPool(name, this);
                }
            };

            return pool;
        };

        var models = avril.mvc.models = getPool('0_default', pools);

        models.pools = pools;

    })();
    var models = avril.mvc.models;
    //#endregion

    //#region controllers
    var controllers = avril.mvc.controllers = {
        _controllers: {}
        , controller: function (name, defineFunc, baseClass) {
            var _controllers = this._controllers;
            switch (arguments.length) {
                case 0: {
                    return null;
                }
                case 1: {
                    var controller = avril.object(_controllers).getVal(name);
                    if (controller) {
                        return controller();
                    } else {
                        throw Error('controller ' + name + ' is undefined.');
                    }
                }
                case 2:
                case 3:
                    {
                        var contrusctor = defineFunc;
                        if (typeof defineFunc === 'object') {
                            contrusctor = function () {
                                avril.extend(this, defineFunc);
                            }
                        }
                        avril.createlibOn(_controllers, name, contrusctor, null, baseClass);
                        return this;
                    }
            }
        }
    };
    //base form controller

    controllers.controller('avril.common.formBase', function (options) {

        var _fields = {}, controller = this;

        this.init = function (postUrl, model) {
            model && this.model(model);
            postUrl && this.postUrl(postUrl);
            return this;
        }

        this.model = ko.observable();
        this.postUrl = ko.observable();
        this.fields = models.getPool();
        this.fields.field = function (path, val) {
            if (!_fields[path]) {
                _fields[path] = this.model(path, val);
            }
            var field = _fields[path], _model = controller.model();
            if (arguments.length == 1 && _model && field() === undefined) {
                field(avril.object(_model).tryGetVal(path));
            }
            return field;
        }
        this.getFormData = function () {
            var formData = {};
            for (var k in this.fields._models) {
                avril.object(formData).setVal(k, this.fields.model(k)());
            }
            return formData;
        }

        this.submit = function (event, $el) {

            !this.postUrl() && this.postUrl($el.parents('form').attr('action'));

            if (!this.postUrl()) {
                throw new Error('post url is required.');
            }
            $.post(
                avril.request(this.postUrl()).param('appId', models.model('meta.selectedApp')()).getUrl()
                , this.getFormData())
                .success(function (res, handlerType, handler) {
                    if( controller.submit.beforeSuccess(avril.toArray(arguments)))
                    controller.submit.onSuccess(avril.toArray(arguments));
                }).error(function (handler, handlerType) {
                    controller.submit.onError(avril.toArray(arguments));
                });
        }

        this.submit.onSuccess = avril.event.get('form.onSuccess', this);

        this.submit.beforeSuccess = avril.event.get('form.beforeSuccess', this);

        this.submit.onError = avril.event.get('form.onError', this);

        this.hook('submit,init');
    });

    //#endregion

    //#region request
    var request = avril.namespace('avril.mvc.request');
    var config = avril.mvc.config;
    var templatePre = 'template-';

    /*clear template cache when version changed*/
    config.onVersionChange(function (oldVersion, newVersion) {
        avril.tools.cache.delByPre(templatePre + oldVersion);
    });

    request.queryTemplate = function (viewUrl, callback) {
        $.ajax({
            url: viewUrl
            , dataType: 'html'
            , success: function (tmpl) {
                callback(null, tmpl);
            }
            , error: function (res) {
                callback(res);
            }
        });
    }

    request.getTemplateUrl = function (path, callback) {
        config.onload(function () {
            var req = avril.request(avril.mvc.config.templateUrl);
            req.param('path', path);
            callback(req.getUrl());
        });
    }

    request.getViewTemplate = function (url, callback) {
        callback = callback || function () { };
        var path = url.split('?')[0]
        , templateName = templatePre + config.version + '-' + (path.split('/').join('-') || 'home')
        , $template = function () { return $('#' + templateName) }
        , templateCache = avril.tools.cache(templateName)
        , queryTemplate = function (path, callback) {
            request.getTemplateUrl(path, function (viewUrl) {
                request.queryTemplate(viewUrl, function (err, tmpl) {
                    avril.tools.cache(templateName, err ? '' : tmpl);
                    callback(err, tmpl);
                });
            });
        }
        , returnCallback = function () {
            var res = {
                data: null
                , template: undefined
                , templateOk: false
            };

            var templateCache = avril.tools.cache(templateName);

            if (templateCache) {
                $template().remove();
                if ($template().length == 0) {
                    var tagName = 'script';
                    $('<' + tagName + ' id="' + templateName + '"' + ' type="text/template">' + templateCache + '</' + tagName + '>').hide().appendTo('body');
                }

                res.template = templateName;
                res.templateOk = true;
            }

            callback(null, res);
        };

        if (templateCache && (config.release === true)) {
            returnCallback();
        } else {
            queryTemplate(path, returnCallback);
        }
    }

    request.getDataUrl = function (url, callback) {
        callback(url);
    }

    request.events = {
        dataQueryStart: avril.event.get('dataQueryStart', request),
        dataQuerySuccess: avril.event.get('dataQuerySuccess', request),
        dataQueryError: avril.event.get('dataQueryError', request)
    };

    request.getViewData = function (url, callback) {
        request.getDataUrl(url, function (url) {
            var res = {
                url: url
            };
            request.events.dataQueryStart([res]);
            $.ajax({
                url: url
                , success: function (json) {
                    request.events.dataQuerySuccess([json]);
                    res.data = json;
                    callback(res);
                }
                , error: function (err) {
                    request.events.dataQueryError([err]);
                    res.err = err;
                    res.data = null;
                    callback(res);
                }
            });
        });
    }

    config.ensure(request, 'getViewTemplate,getViewData');
    //#endregion

    //region events
    var events = avril.namespace('avril.mvc.events');
    events.get = function (name) {
        return function (event, element) {
            avril.event.get(name, events)([event, element]);
        }
    }
    events.add = function (name, func) {
        avril.event.get(name, events)(func);
    }
    //#endregion

    //#region routes

    avril.namespace('avril.mvc.routes');

    var routes = avril.mvc.routes
    , mvc = avril.mvc
    , _reload
    , mvc_page_model_key = 'mvc.pageModel'
    , mvc_currentRoute_key = 'mvc.currentRoute'
    , AppRoute = routes.mvcRoute = Backbone.Router.extend({
        routes: {
            '*normalPath': 'normalPath'
        }
        , normalPath: function (query) {

            var notfound = function () {
                mvc.request.getViewTemplate('404', function (res) {
                    models.model(mvc_page_model_key)(res);
                }, false);
            };

            models.model(mvc_currentRoute_key)(null);

            mvc.request.getViewTemplate(query, function (resTmpl) {
                if (resTmpl.templateOk) {
                    (_reload = function () {
                        config.defaultLoadData && mvc.request.getViewData(Backbone.history.getHash(), function (resData) {
                            var res = $.extend({}, resTmpl, resData);
                            models.model(mvc_page_model_key)(res);
                        });
                        !config.defaultLoadData && models.model(mvc_page_model_key)(resTmpl);
                    })();
                } else {
                    notfound();
                }
            });
        }
    })
    , addRoute = routes.addRoute = function (name, route, viewPath, needDataOrDataPath, func) {
        if (route.indexOf('?') < 0) {
            addRoute(name, route + '?*query', viewPath, needDataOrDataPath, func);
        }
        var needData, dataPath;
        if (needDataOrDataPath && typeof (needDataOrDataPath) === 'string') {
            dataPath = needDataOrDataPath;
            needData = true;
        }

        func = func || function () { };

        appRoute.route(route, name, function (query) {
            var routeArgs = arguments;
            models.model(mvc_currentRoute_key)({
                name: name
                , route: route
                , viewPath: viewPath
            });
            mvc.request.getViewTemplate(viewPath, function (err, resTmpl) {
                (needData === undefined) && (needData = config.defaultLoadData);
                if (needData) {

                    var url = Backbone.history.getHash();

                    if (dataPath) {
                        var req = avril.request(dataPath);
                        var qReq = avril.request('?' + query);
                        for (var k in qReq.queryString) {
                            k && qReq.param(k) && req.param(k, qReq.param(k));
                        }
                        url = req.getUrl();
                    }

                    (_reload = function () {
                        var queryId = avril.getHash({});
                        _reload.id = queryId;
                        mvc.request.getViewData(url, function (resData) {
                            if (_reload && queryId != _reload.id) {
                                return false;
                            }
                            var res = $.extend({}, resTmpl, resData);
                            models.model(mvc_page_model_key)(res);
                            func.apply(mvc, routeArgs);
                        })
                    })();
                } else {
                    _reload = undefined;
                    models.model(mvc_page_model_key)(resTmpl);
                    func.apply(mvc, routeArgs);
                }
            });
        });
        return routes;
    }
    , addStaticRoute = routes.addStaticRoute = function (name, route, viewPath, func) {
        return addRoute(name, route, viewPath, func, false);
    }
    , appRoute = routes.mvcRoute = new routes.mvcRoute();

    routes.onHashChange = avril.event.get('avril.mvc.routes.onhashchange', routes);

    routes.getHash = function () {
        return Backbone.history.getHash();
    }

    routes.reload = function () {
        _reload && _reload(new Date());
    }

    Backbone.history.bind('all', function () {
        routes.onHashChange([]);
    });

    //#endregion

    //#region 

    //start running avril.mvc
    $(function () {

        // start navigator
        Backbone.history.start();

        //do init 
        ko.applyBindings(mvc, document.html);
    });
    //#endregion
})(jQuery);