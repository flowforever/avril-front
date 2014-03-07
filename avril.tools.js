/// <reference path="../_references.js" />

; (function ($, avril) {

    avril.namespace('avril.tools');

    var _cache = {};

    //#region avril.request
    (function (avril) {
        if (avril.request) {
            return false;
        }
        avril.request = (function () {
            function request(queryStr) {
                var api = {
                };

                api.queryString = (function () {
                    if (queryStr.indexOf('?') < 0) {
                        return {};
                    }
                    var urlParams = {},
                    e,
                    d = function (s) { return decodeURIComponent(s.replace(/\+/g, " ")); },
                    q = queryStr.substring(queryStr.indexOf('?') + 1),
                    r = /([^&=]+)=?([^&]*)/g;

                    while (e = r.exec(q))
                        urlParams[d(e[1])] = d(e[2]);

                    return urlParams;
                })();

                var setParam = function (key, value) {
                    var hasKey = false;
                    avril.object(api.queryString).each(function (k, v) {
                        if (key.toLower() == k.toLower()) {
                            hasKey = true;
                            api.queryString[k] = value;
                        }
                    });
                    if (!hasKey) {
                        api.queryString[key] = value;
                    }
                    return api;
                }

                var getParam = function (key) {
                    var val;
                    avril.object(api.queryString).each(function (k, v) {
                        if (key.toLower() == k.toLower()) {
                            val = v;
                        }
                    });
                    return val;
                }

                api.param = function (key, value) {
                    if (arguments.length == 0) {
                        return this;
                    }
                    if (arguments.length == 1) {
                        if (typeof key == 'string') {
                            return getParam(key);
                        } else if (typeof key == 'object') {
                            for (var k in key) {
                                setParam(k,key[k]);
                            }
                        }
                        return this;
                    }
                    if (arguments.length == 2) {
                        return setParam(key, value);
                    }
                }

                api.getUrl = function () {
                    var url = queryStr.split('?')[0];

                    if (url.indexOf('?') < 0) {
                        url = url + '?';
                    }

                    for (var p in api.queryString) {
                        if (api.queryString[p] != null) {
                            url += p + '=' + encodeURI(api.queryString[p]) + "&";
                        }
                    }

                    if (url.lastIndexOf('&') == url.length - 1) {
                        return url.substring(0, url.lastIndexOf('&'));
                    }

                    if (url.lastIndexOf('?') == url.length - 1) {
                        return url.substring(0, url.lastIndexOf('?'));
                    }

                    return url;
                }

                api.toString = function () {
                    return this.getUrl();
                }

                return api;
            }

            $.extend(request, request(window.location.href));

            return request;
        })();
    })(avril);
    //#endregion

    //#region avril.tools.loader
    avril.namespace('avril.tools.loader');
    avril.tools.loader.extend({
        jsonp: function (options) {
            options.success = options.success || function () { };
            options.error = options.error || function () { };
            var jsonpcallback = 'avril_' + avril.guid();
            window[jsonpcallback] = function () {
                script.jsonp = true;
                if (options.success) {
                    var obj = arguments[0];
                    if (typeof obj == 'string') {
                        obj = eval('(' + obj + ')')
                    }
                    options.success(obj);
                }
            };
            var script = document.createElement('script');
            script.type = "text/javascript";
            script.language = "javascript";
            script.charset = "utf-8";
            script.async = true;
            var head = document.getElementsByTagName('head');

            function removeScript() {
                if (typeof script.jsonp === "undefined") {
                    options.error();
                }
                function clear() {
                    try {
                        (head ? head[0] : document).removeChild(script);
                    } catch (E) { }
                    try {
                        delete window[jsonpcallback];
                    } catch (E) { }
                }
                setTimeout(function () {
                    clear();
                }, 5000);
            }

            head[0].appendChild(script);

            script.onload = script.onreadystatechange = function () {
                if (-[1, ] || /loaded|complete/i.test(this.readyState)) {
                    removeScript();
                }
            }

            script.onerror = function () {
                removeScript();
            }

            var request = avril.request(options.url);
            if (options.data) {
                avril.object(options.data).each(function (key, value) {
                    if (typeof value != 'function' && typeof value != 'object') {
                        request.param(key, encodeURIComponent(value));
                    }
                });
            }
            request.param(options.jsonp || 'jsonpcallback', jsonpcallback);
            script.src = request.getUrl();
        }
        , json: function (options) {
            if (options.url
                && options.url.indexOf('http') == 0
                && options.url.indexOf('http://' + document.location.host) < 0
                && options.url.indexOf('https://' + document.location.host) < 0
                ) {
                this.jsonp(options);
            } else {
                $.ajax(options);
            }
        }
        , loadScript: function (url, callback) {
            if (!callbackCache.hasOwnProperty(url)) {
                loadingList.push(url);
                callbackCache[url] = callback || function () { };
                if (loadingList.length == 1) {
                    this._loadScript();
                }
            } else {
                callback();
            }
        }
        , loadStyle: function (url) {
            var head = document.getElementsByTagName('head') || document.getElementById('body');
            var style = document.createElement('link');
            style.rel = 'Stylesheet';
            style.type = 'text/css';
            (head ? head[0] : document).appendChild(style);
            style.href = url;
        }
        , template: function (url, callback) {
            var tmpl = avril.tools.cache(url);
            if (tmpl) {
                callback(cache);
            } else {
                $.get(url, function (tmpl) {
                    callback(tmpl);
                    avril.tools.cache(url, tmpl);
                });
            }
        }
    });
    //#endregion

    //#region avril.tools.Communicator
    avril.createlib('avril.tools.Communicator', function (options) {
        var config = $.extend(this.options(), {
            targetWindow: window
        }, options)
        , self = this
        , _init = avril.event.registerOn(this, 'init', this, this)
        , _tasks = _cache._cacheData = {}
        , _lastMessage = [];

        _init(function () {
            if (window.postMessage) {
                if (window.addEventListener) {
                    window.addEventListener("message", function (e) {
                        onMessage([$.parseJSON(e.data).data]);
                    }, false);
                } else if (window.attachEvent) {
                    window.attachEvent("onmessage", function (e) {
                        onMessage([$.parseJSON(e.data).data]);
                    });
                }
            } else {
                //TODO change this implement into from server side
                var hash = '';
                setInterval(function () {
                    if (window.name !== hash) {
                        hash = window.name;
                        onMessage([$.parseJSON(hash).data]);
                    }
                }, 1);
            }
        });

        this.targetWindow = config.targetWindow;

        this.init = function (options) {
            if (options) { this.options(options); }
            _init([this]);
            return this;
        }

        var postMessage = function (data, needFeedback) {
            var guid = avril.guid() + '_guid', _d = data;
            data.guid = guid;
            data.needFeedback = !!needFeedback;
            data = $.toJSON({
                data: data
                , guid: guid
            });
            _tasks[guid] = [];
            var times = 0;
            (function post() {
                config.targetWindow.postMessage ? config.targetWindow.postMessage(data, '*') : (function () {
                    config.targetWindow.name = data;
                })();
                if (needFeedback && times++ < 10000) {
                    _tasks[guid].push(setTimeout(post, 500 + times));
                }
            })();
        }

        var onMessage = avril.event.registerOn(this, 'onMessage', this, this);

        var onFeedback = this.onFeedback = avril.event.registerOn(this, 'onFeedback', this, this);

        var CommandType = this.commandType = {
            im: 'im'
            , command: 'command'
            , feedback: 'feedback'
            , message: 'message'
        };

        this.postCommand = function (data) {
            if (arguments.length == 2) {
                data = {
                    name: arguments[0]
                    , data: arguments[1]
                };
            }
            postMessage({
                type: CommandType.command
                , data: data
            }, true);
        }

        this.onCommand = avril.event.registerOn(this, 'onCommand', this, this);

        this.postIM = function (data) {
            postMessage({
                type: CommandType.im
                , data: data
            }, true);
        }

        this.onIM = avril.event.registerOn(this, 'onIM', this, this);

        onMessage(function (msg) {
            if (_lastMessage.contain(msg.guid)) {
                return false;
            }
            var result = true;
            switch (msg.type) {
                case CommandType.command: {
                    result = self.onCommand([msg.data]);
                    break;
                }
                case CommandType.im: {
                    result = self.onIM([msg.data]);
                    break;
                }
                case CommandType.feedback: {
                    result = onFeedback([msg.data]);
                    break;
                }
            }

            if (result) {
                _lastMessage.push(msg.guid);
                if (msg.needFeedback) {
                    postMessage({
                        type: CommandType.feedback
                        , data: msg.guid
                    });
                }
            }
        });

        onFeedback(function (guid) {
            if (_cache._cacheData[guid]) {
                _cache._cacheData[guid].each(function (timeoutid) {
                    try { clearTimeout(timeoutid); } catch (E) { }
                });
            }
        });

        this.events.onOptionChange(function (key, config, oldConfig) {
            if (key == 'targetWindow') {
                self.targetWindow = config.targetWindow;
            }
        });
    });
    avril.tools.Communicator.current = avril.tools.Communicator();
    //#endregion

    //#region avril.tools.cache
    avril.tools.cache = (function () {
        var cache = window.localStorage || {};

        var handler = function (key, value) {
            switch (arguments.length) {
                case 0: {
                    return cache;
                }
                case 1: {
                    return cache[key];
                }
                case 2: {
                    return cache[key] = value;
                }
            }
        };

        handler.del = function (key) {
            delete cache[key];
        }

        handler.delByPre = function (pre) {
            for (var k in cache) {
                if (k.indexOf(pre) == 0) {
                    handler.del(k);
                }
            }
        }

        handler.list = function (key, list) {
            function init(list) {
                list.save = function () {
                    handler.list(key, list);
                }
                return list;
            }
            switch (arguments.length) {
                case 1: {
                    var arr = [];
                    if (handler(key)) {
                        var list = $.parseJSON(handler(key)).data;
                        init(list);
                        return list;
                    }
                    return init(arr);
                }
                case 2: {
                    if (list instanceof Array) {
                        handler(key, $.toJSON({ data: list }));
                        return init(list);
                    } else {
                        var arr = [list];
                        handler(key, $.toJSON({ data: arr }));
                        return init(arr);
                    }
                }
            }
        }

        handler.object = function (key, obj) {
            function init(obj) {
                obj = obj || {};
                obj.save = function () {
                    handler.object(key, obj);
                    return obj;
                }
                return obj;
            }
            switch (arguments.length) {
                case 1: {
                    obj = handler(key);
                    if (!obj) {
                        return init();
                    }
                    return init($.parseJSON(obj).data);
                }
                case 2: {
                    handler(key, $.toJSON({ data: obj }));
                    return init(obj);
                }
            }
        }

        handler.localStorage = !!window.localStorage;

        return handler;
    })();
    //#endregion

    //#region avril.tools.localize
    (function () {
        avril.createlib('avril.tools.Localize', function (options) {
            var config = $.extend(this.options(), {
                url: '/resources/localize'
                , datatype: 'jsonp' // 'jsonp' || 'json'
                , version: '0.1'
                , language: 'default'
                , type: 'post'
            }, options);

            this.parse = function (context, force) {

                if (config.enabled == false) {
                    return false;
                }

                var localizeItems = $(context).is('[data-localize]') ? $(context) : $(force ? '[data-localize]' : '[data-localize][data-localize!=true]', context || 'body');

                var languagePack = avril.tools.cache.list(config.language);

                var keys = []
                , handles = []
                , getLocalizeInfo = function (text) {
                    return languagePack.first(function (item) {
                        return item.key == text;
                    });
                };

                localizeItems.each(function () {
                    var handle = $(this);
                    if (handle.is('[data-localize]')) {
                        var localizeInfo = getLocalizeInfo(handle.html());
                        if (localizeInfo == null) {
                            keys.push(handle.html());
                            handles.push(handle);
                        } else {
                            handle.html(localizeInfo.text);
                        }
                    }
                });

                if (keys.length > 0) {
                    $.ajax($.extend({
                        data: { data: keys }
                        , success: function (localizes) {
                            localizes.each(function (text, index) {
                                text = unescape(text);
                                handles[index].html(text).attr('localize', 'true');
                                var lan = languagePack.first(function (lan) {
                                    return lan.key == keys[index]
                                });
                                if (lan == null) {
                                    languagePack.push({ key: keys[index], text: text });
                                } else {
                                    lan.text = text;
                                }
                            });
                            languagePack.save();
                        }
                    }, config));
                }
            }
        });
        avril.tools.localize = avril.tools.Localize();
    })();

    //#endregion


    //#region avril.tools.longpull

    //#endregion

})($, avril);
