﻿/// <reference path="../../scripts/_references.js" />
/*
* avril mvc framework hardly dependency on Backbone.js and Knockout.js 
* please ensure you have referenced this two scripts
*/
(function ($) {

    //#region config 

    avril.namespace('avril.mvc.config');

    var configUrl = '/resources/config';

    var config = avril.mvc.config;

    $.extend(config, {
        templateUrl: '/resources/template'
        , release: false
        , configUrl: configUrl
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
        avril.release = config.release;
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

    avril.namespace('avril.mvc.models');

    var models = avril.mvc.models;

    var mvc = avril.mvc, getPool = function () {
        var pool = {
            _models: {}
            , model: function (name, model) {
                if (!name) { return undefined; }
                if (!pool._models[name]) {
                    arguments.length == 1 && (pool._models[name] = ko.observable());
                    arguments.length == 2 && (pool._models[name] = ko.observable(model));
                } else {
                    arguments.length == 2 && (pool._models[name](model));
                }
                return pool._models[name];
            }
        };
        return pool;
    };

    var pools = models.pools = getPool();

    models.getPool = getPool;

    mvc.config.onload(function () {
        avril.object(config.meta).keys()
        .each(function (key) {
            pools.model('meta.' + key, config.meta[key]);
        });
    });

    //#endregion

    //#region request
    avril.namespace('avril.mvc.request');

    var request = avril.mvc.request;
    var config = avril.mvc.config;
    var templatePre = 'template-';

    /*clear template cache when version changed*/
    config.onVersionChange(function (oldVersion, newVersion) {
        avril.tools.cache.delByPre(templatePre + oldVersion);
    });

    request.getTemplateUrl = function (path, callback) {
        config.onload(function () {
            var req = avril.request(avril.mvc.config.templateUrl);
            req.param('path', path);
            callback(req.getUrl());
        });
    }

    request.getViewTemplate = function (url, callback) {
        callback = callback || function () { };
        var res = {
            data: null
            , template: undefined
            , templateOk: false
        }
        , path = url.split('?')[0]
        , templateName = templatePre + config.version + '-' + (path.split('/').join('-') || 'home')
        , $template = $('#' + templateName)
        , templateCache = avril.tools.cache(templateName)
        , queryTemplate = function (path, callback) {
            request.getTemplateUrl(path, function (viewUrl) {
                $.ajax({
                    url: viewUrl
                    , success: function (tmpl) {
                        avril.tools.cache(templateName, tmpl);
                        callback();
                    }
                    , error: function (res) {
                        callback(res);
                    }
                });
            });
        }
        , returnCallback = function () {
            $template = $('#' + templateName);

            templateCache = avril.tools.cache(templateName);

            if (templateCache) {

                if ($template.length == 0) {
                    var tagName = 'script';
                    $('<' + tagName + ' type="text/template"/>').attr('id', templateName).hide()
                        .html(templateCache).appendTo('body');
                }

                res.template = templateName;
                res.templateOk = true;
            }

            callback(res);
        };

        if (templateCache && (config.release === true)) {
            returnCallback();
        } else {
            queryTemplate(path, returnCallback);
        }
    }

    request.getViewData = function (url, callback) {
        var res = {
            url: url
        };
        $.ajax({
            url: url
            , data: {
                _backbone: true
            }
            , success: function (json) {
                res.data = json;
                callback(res);
            }
            , error: function (err) {
                res.err = err;
                res.data = null;
                callback(res);
            }
        });
    }

    //#endregion

    //#region routes

    avril.namespace('avril.mvc.routes');

    var routes = avril.mvc.routes
    , mvc = avril.mvc
    , AppRoute = routes.mvcRoute = Backbone.Router.extend({
        routes: {
            '*normalPath': 'normalPath'
        }
        , normalPath: function (query) {

            var notfound = function () {
                mvc.request.getViewTemplate('404', function (res) {
                    mvc.models.pools.model('pageModel')(res);
                }, false);
            };

            models.pools.model('currentRoute')(null);

            mvc.request.getViewTemplate(query, function (resTmpl) {
                if (resTmpl.templateOk) {
                    mvc.request.getViewData(Backbone.history.getHash(), function (resData) {
                        var res = $.extend({}, resTmpl, resData);
                        mvc.models.pools.model('pageModel')(res);
                    });
                } else {
                    notfound();
                }
            });
        }
    })
    , addRoute = routes.addRoute = function (name, route, viewPath, func, needDataOrDataPath) {        
        if (route.indexOf('?') < 0) {
            addRoute(name, route + '?*query', viewPath, func, needDataOrDataPath);
        }

        var needData, dataPath;
        if (needDataOrDataPath && typeof (needDataOrDataPath) === 'string') {
            dataPath = needDataOrDataPath;
            needData = true;
        }
        (arguments.length < 5) && (needData = true);//set needData default true

        func = func || function () { };

        appRoute.route(route, name, function (query) {
            var routeArgs = arguments;
            models.pools.model('currentRoute')({
                name: name
                , route: route
                , viewPath: viewPath
            });
            mvc.request.getViewTemplate(viewPath, function (resTmpl) {
                if (needData) {
                    mvc.request.getViewData(dataPath || Backbone.history.getHash(), function (resData) {
                        var res = $.extend({}, resTmpl, resData);
                        mvc.models.pools.model('pageModel')(res);
                        func.apply(mvc.models.pools, routeArgs);
                    });
                } else {
                    mvc.models.pools.model('pageModel')(resTmpl);
                    func.apply(mvc.models.pools, routeArgs);
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
        ko.applyBindings(avril.mvc.models.pools, document.body);
    });
    //#endregion
})(jQuery);