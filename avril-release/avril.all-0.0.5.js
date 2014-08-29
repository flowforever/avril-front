(function (window) {

    if (window.avril && avril.avril) {
        return avril;
    }

    //#endregion

    //#region avril

    (function () {
        var _avril = window.avril;

        ///<summary>
        /// avril js framework
        /// by avril.namespace("adminJs.global"); adminJs.global is avaliable
        /// adminJs.global.extend({ sayHello: function(){ alert('hello ') }});
        /// adminJs.global.extend({ sayHi: function(){ alert('hi ') }});
        /// adminJs.global.extend({ ready: function(){ alert('i am going here! ') }});//ready method will execute immediately
        /// avril.namespace("adminJs.fileJs");
        /// adminJs.fileJs.extend({ sayHello: function(){ alert('hello ') }});
        /// avril.using(adminJs.global,function(global){
        ///     sayHello();
        ///     global.sayHello();
        /// });
        /// avril.using([adminJs.global,adminJs.fileJs],function(global,fileJs){
        ///     fileJs.sayHello();
        ///     global.sayHello();
        ///     sayHi();
        /// });
        ///</summary>

        var avril = {};

        avril.avril = 'avril';

        avril.$ = jQuery;

        var _extendMethod = function (obj) {
            if (typeof (obj) == 'function' || typeof (obj) == 'object') {
                obj.extend = function (objx, objx2) {
                    if (objx) {
                        if (objx2) {
                            if (typeof (objx) == 'string') {
                                obj[objx] = objx2;
                            }
                        } else {
                            if (typeof (objx) == 'function' || typeof (objx) == 'object') {
                                for (var p in objx) {
                                    obj[p] = objx[p];
                                    _extendMethod(obj[p]);
                                } // end for
                                if (objx.ready && typeof (objx.ready) == 'function') {
                                    avril.ready(function () {
                                        objx.ready.call(objx);
                                    });
                                }
                            } //end if
                        } //end  if (typeof (objx) == 'string')
                    } //end if(objx)
                } // end extend
            } //end if
        };

        avril.isValueType = function (input) {
            return input == null || 'number,boolean,string,undefined'.split(',').indexOf(typeof input) >= 0;
        }

        avril.isFunc = function (obj) {
            return typeof obj == 'function';
        }

        avril.isObj = function (obj) {
            return typeof obj == 'object';
        }

        avril.isArray = function (obj) {
            return obj instanceof Array;
        }

        avril.isStr = function (obj) {
            return typeof obj == 'string';
        }

        avril.helper = {
            encode: function (input) {
                return $('<div/>').html(input).text();
            }
            , decode: function (input) {
                return $('<div/>').text(input).html();
            }
            , encodeReg: function (input) {
                var keywords = '~!@#$%^&*()/\\|[].'.split('');
                return input.split('').select(function (word) {
                    return keywords.indexOf(word) >= 0 ? ('\\' + word) : word;
                }).join('');
            }
        };

        avril.namespace = function (spaceName, obj) {
            ///<summary>
            /// registing method or object to avril
            ///</summary>
            ///<param type="string" name="spaceName">
            /// create a namespace
            ///</param>

            if (spaceName && typeof (spaceName) == 'string') {
                ///
                function _creatObject(objName, obj) {
                    if (objName.indexOf('.') > 0) {
                        var first = objName.substring(0, objName.indexOf("."));
                        if (!obj[first]) {
                            obj[first] = new Object();
                            _extendMethod(obj[first]);
                        }
                        return _creatObject(objName.substring(objName.indexOf(".") + 1), obj[first]);
                    } else {
                        if (!obj[objName]) {
                            obj[objName] = new Object();
                            _extendMethod(obj[objName]);
                            return obj[objName];
                        }
                    }
                }
                return _creatObject(spaceName, obj || window);
            }
            else {
                throw " typeof(spaceName) must be string!";
            }
        }

        avril.module = function (namespace, dependences, func) {
            ///<summary>
            /// registing method or object to avril
            ///</summary>
            ///<param type="object" name="spaceName">
            /// create a namespace
            ///</param>
            arguments.length == 2 && (func = dependences, dependences = []);
            if (typeof dependences === 'string') {
                dependences = dependences.trimAll().split(',');
            }
            var getEvent = avril.module.getModuleEvent
            , waitModules = dependences.where(function (ns) {
                return !avril.object(window).getVal(ns);
            })
            , executeCount = 0
            , execute = function (times) {
                printDependences();
                if (times == waitModules.length) {
                    avril.namespace(namespace);
                    var module = avril.object(window).getVal(namespace);
                    var dependenceModules = dependences.select(function (ns) {
                        return avril.object(window).getVal(ns);
                    });
                    func.apply(module, dependenceModules);
                    getEvent(namespace)([name]);
                }
            }
            , printDependences = function () {
                var _waits = waitModules.where(function (module) {
                    return !avril.object(window).getVal(module);
                });
                var _finished = dependences.where(function (module) {
                    return !!avril.object(window).getVal(module);
                });
                if (_waits.length == 0) {
                    console.log(namespace + ' dependences loaded complete.');
                } else {
                    console.log(namespace + ' dependences loaded ' + _finished.join(',') + ', waiting: ' + _waits.join(','));
                }
            };

            if (waitModules.length > 0) {
                waitModules.each(function (ns) {
                    getEvent(ns)(function () {
                        execute(++executeCount);
                    });
                });
            }

            execute(0);
        }

        avril.module.getModuleEvent = function (ns) {
            return avril.event.get('module.events.' + ns);
        }

        avril.module.notify = function (ns, data) {
            avril.module.getModuleEvent(ns)([ns, data])
        }

        avril.module.subscribe = function (ns, func) {
            avril.module.getModuleEvent(ns)(func);
        }

        avril.extend = function (obj1, obj2) {
            ///<summary>
            /// this method can extend fJs
            ///</summary>
            ///<param type="object" name="obj1">
            /// fist object to extend if obj2 is null obj1's attribute will be extended to avril
            ///</param>
            ///<param type="object" name="obj2">
            /// extend obj2's attribute to obj1
            ///</param>
            ///<returns type="function">

            var obj1 = arguments[0];
            var obj2 = arguments[1];
            if (obj1) {
                if (obj2) {
                    if (typeof (obj1) == 'string') {
                        avril[obj1] = obj2;
                        _extendMethod(avril[obj1]);
                    }
                    else if (typeof (obj1) == 'object' || typeof (obj1) == 'function') {
                        for (var p in obj2) {
                            obj1[p] = obj2[p];
                        }
                    }
                }
                else {
                    if (typeof (obj1) == 'object' || typeof (obj1) == 'function') {
                        for (var p in obj1) {
                            avril[p] = obj1[p];
                            _extendMethod(avril[p]);
                        }
                    }
                }
            }

            return avril;
        }

        //------useful method in js----------------------

        ///Class avril.object
        var avrilObject = {
            maxDeep: 5,
            isValueType: function (input) {
                return input == null || 'number,boolean,string,undefined'.split(',').indexOf(typeof input) >= 0;
            },
            getVal: function (obj, pStr) {
                if (pStr.indexOf('.') > 0) {
                    var firstProp = pStr.substring(0, pStr.indexOf("."));

                    var lastProp = pStr.substring(pStr.indexOf('.') + 1);
                    if (firstProp.indexOf('[') >= 0) {
                        var index = firstProp.substring(firstProp.indexOf('[') + 1, firstProp.lastIndexOf(']'));
                        index = parseInt(index);
                        if (firstProp.indexOf('[') == 0) {
                            return this.getVal(obj[index], lastProp);
                        } else if (firstProp.indexOf('[') > 0) {
                            var propertyName = pStr.substring(0, pStr.indexOf('['));
                            if (propertyName.indexOf('"') == 0) {
                                propertyName = propertyName.substring(1, propertyName.length - 2);
                            }
                            return this.getVal(obj[propertyName][index], lastProp);
                        }
                    } else {
                        var pObj = obj[firstProp];
                        return this.getVal(pObj, lastProp);
                    }
                } else {
                    if (pStr.indexOf('[') >= 0) {
                        var index = pStr.substring(pStr.indexOf('[') + 1, pStr.lastIndexOf(']'));
                        index = parseInt(index);
                        if (pStr.indexOf('[') == 0) {
                            return obj[index];
                        } else if (pStr.indexOf('[') > 0) {
                            var propertyName = pStr.substring(0, pStr.indexOf('['));
                            return obj[propertyName][index];
                        }
                    } else {
                        return obj[pStr];
                    }
                }
            },
            setVal: function (obj, pStr, val) {
                if (pStr.indexOf('.') > 0) {
                    var firstProp = pStr.substring(0, pStr.indexOf("."));

                    var lastProp = pStr.substring(pStr.indexOf('.') + 1);

                    if (firstProp.indexOf('[') >= 0) {
                        var index = firstProp.substring(firstProp.indexOf('[') + 1, firstProp.indexOf(']'));
                        index = parseInt(index);

                        if (firstProp.indexOf('[') == 0) {
                            if (!obj[index]) { obj[index] = {}; };
                            this.setVal(obj[index], lastProp, val);
                        } else if (firstProp.indexOf('[') > 0) {
                            var propertyName = pStr.substring(0, pStr.indexOf('['));

                            if (!obj[propertyName]) { obj[propertyName] = []; };

                            if (!obj[propertyName][index]) { obj[propertyName][index] = {}; };

                            this.setVal(obj[propertyName][index], lastProp, val);
                        }
                    } else {
                        if (!obj[firstProp]) {
                            obj[firstProp] = {};
                        }
                        this.setVal(obj[firstProp], lastProp, val);
                    }
                } else {
                    var arrayReg = /\[\d*\]/;
                    if (arrayReg.test(pStr)) {
                        var index = pStr.substring(pStr.indexOf('[') + 1, pStr.lastIndexOf(']'));

                        index = parseInt(index);
                        if (pStr.indexOf('[') == 0) {
                            obj[index] = val;
                        } else if (pStr.indexOf('[') > 0) {
                            var propertyName = pStr.substring(0, pStr.indexOf('['));
                            if (!obj[propertyName]) {
                                obj[propertyName] = [];
                            }
                            obj[propertyName][index] = val;
                        }
                    } else {
                        obj[pStr] = val;
                    }
                }
                return obj;
            },
            beautifyNames: function (obj, deep, changeName) {
                var self = this;
                if (avril.isArray(obj)) {
                    var r = [];
                    for (var i = 0; i < obj.length; i++) {
                        var val = obj[i];
                        if (avril.isObj(val) || avril.isArray(val)) {
                            val = self.beautifyNames(val, deep + 1, changeName);
                        }
                        r.push(val);
                    }
                    return r;
                } else if (avril.isObj(obj)) {
                    var result = {};
                    deep = deep == undefined || isNaN(deep) ? 0 : deep;
                    if (deep > this.maxDeep) {
                        return result;
                    }
                    if (changeName == undefined) {
                        changeName = true;
                    }
                    this.each(obj, function (key, value) {
                        if (self.isValueType(value)) {
                            result[key] = value;
                        } else {
                            if (!avril.isObj(value)) {
                                if (avril.isStr(key) && changeName) {
                                    result[key.lowerChar0()] = value;
                                } else {
                                    result[key] = value;
                                }
                            } else { // value is object
                                if (avril.isStr(key) && changeName) {
                                    result[key.lowerChar0()] = avril.object.beautifyNames(value, deep + 1, changeName);
                                } else {
                                    result[key] = avril.object.beautifyNames(value, deep + 1, changeName);
                                }
                            }
                        }
                    });
                    return result;
                }
            },
            deepClone: function (obj, deep) {
                return this.beautifyNames(obj, deep, false);
            },
            each: function (obj, func) {
                if (!avril.isFunc(func)) {
                    return false;
                }
                if (avril.isArray(obj)) {
                    for (var i = 0; i < obj.length; i++) {
                        if (func(i, obj[i]) == false) return false;
                    }
                } else {
                    for (var key in obj) {
                        if (func(key, obj[key]) == false) return false;
                    }
                }
            },
            keys: function (obj) {
                var keys = [];
                this.each(obj, function (key, value) { keys.push(key); });
                return keys;
            },
            values: function (obj) {
                var values = [];
                this.each(obj, function (key, value) { values.push(value); });
                return values;
            },
            tryGetVal: function (obj, pStr) {
                var val = undefined;
                try {
                    val = this.getVal(obj, pStr);
                } catch (E) {
                }
                return val;
            },
            instanceOf: function (obj, type) {
                return obj instanceof type;
            },
            keyValues: function (obj) {
                var result = [];
                this.each(obj, function (key, value) {
                    result.push({ key: key, value: value });
                });
                return result;
            },
            toArray: function (obj) {
                var res = [];
                if (obj.length) {
                    for (var i = 0 ; i < obj.length; i++) {
                        res.push(obj[i]);
                    }
                }
                return res;
            }
        };

        avril.object = function (obj) {
            var api = {
                getVal: function (pStr) {
                    return avril.object.getVal(obj, pStr);
                },
                setVal: function (pStr, val) {
                    return avril.object.setVal(obj, pStr, val);
                },
                each: function (func) {
                    avril.object.each(obj, func);
                },
                keys: function () { return avril.object.keys(obj); },
                values: function () { return avril.object.values(obj); },
                beautifyNames: function () {
                    return avril.object.beautifyNames(obj);
                },
                deepClone: function (deep) {
                    return avril.object.deepClone(obj, deep);
                },
                tryGetVal: function (pStr) {
                    var val = undefined;
                    try {
                        val = avril.object.getVal(obj, pStr);
                    } catch (E) {
                    }
                    return val;
                },
                instanceOf: function (type) {
                    return avril.object.instanceOf(obj, type);
                },
                keyValues: function () {
                    return avril.object.keyValues(obj);
                },
                toArray: function () {
                    return avril.object.toArray(obj);
                }
            };
            return api;
        }

        $.extend(avril.object, avrilObject);

        var _tempdata = {};

        avril.data = function (name, value) {
            if (typeof name != 'string') {
                name = avril.getHash(name).toLowerCase();
            }

            if (arguments.length == 1) {
                try {
                    var result = avril.object.getVal(_tempdata, name);
                    return result;
                }
                catch (E) { }
                return null;
            } else if (arguments.length == 2) {
                avril.object.setVal(_tempdata, name, value);
            } else if (arguments.length == 0) {
                return _tempdata;
            }
        }

        avril.guid = function () {
            return (new Date().getTime()) + '_' + Math.random().toString().replace('.', '_');
        }

        avril.alert = function (msg) {
            alert(msg);
        }

        avril.confirm = function (msg, callback, title) {
            //Disable confirm if the message is null.
            if (msg == undefined || msg == '') {
                callback(true);
            }
            else
                callback(confirm(msg));
        }

        var objReference = [];

        var __getHash = function (obj) {
            var query = objReference
                .first(function (val) { return val.obj == obj; });
            if (!query) {
                query = {
                    obj: obj,
                    key: avril.guid()
                };
                objReference.push(query);
            }

            return query.key;
        }

        //window.name = 'avril';

        avril.getHash = __getHash;

        var _single_getHashInited = false;

        avril._single = function () {
            if (!_single_getHashInited) {
                avril.getHash = top.avril ? top.avril.getHash : __getHash;
            }
            _single_getHashInited = true;
        }

        //-------end us -useful method in js------------

        window.avril = avril;
    })(); //end avril

    //#endregion

    //#region avril.event

    (function ($, avril) {

        if (avril.event) {
            return true;
        }

        var event = avril.event = {};

        var guid = avril.guid();

        var index = 0;

        var _beautifyFunName = function () {
            var arr = [];
            if (arguments.length) {
                for (var i = 0; i < arguments.length; i++) {
                    arr.push(arguments[i]);
                }
            } else {
                return '';
            }
            if (arr[0]) {
                arr[0] = arr[0].lowerChar0();
            }
            for (var i = 1; i < arguments.length; i++) {
                arr[i] = arr[i].uperChar0();
            }
            return arr.join('');
        }

        event._event = {
            eventList: {},
            add: function (func, name, data, executeContext) {
                name = name || "default";

                if (!this.eventList[name]) {
                    this.eventList[name] = [];
                }

                var eve = {
                    func: func,
                    data: data
                };

                this.eventList[name].push(eve);
            },
            execute: function (name, context, data) {
                name = name || 'default';

                this.eventList[name] = this.eventList[name] || [];

                context = context || avril.event._event;

                var result = true;

                this.eventList[name].each(function (fnObj) {
                    if (data && data.length >= 0) {
                        var args = [];
                        for (var i = 0; i < data.length; i++) {
                            args.push(data[i]);
                        }
                        if (fnObj.data) {
                            args.push(fnObj.data);
                        }
                        result = result && (!(fnObj.func.apply(context, args) == false));
                    } else {
                        result = result && (!(fnObj.func.call(context, data, fnObj.data) == false));
                    }
                });

                return result;
            },
            clear: function (name) {
                this.eventList[name] = [];
            }
        };

        event.events = event._event.eventList;

        event.register = function (fnName, executeContext) {
            if (event._event[fnName]) {
                return event._event[fnName]
            }
            var func = function (func, data) {
                if (typeof (func) == 'function') {
                    avril.event._event.add(func, fnName, data, executeContext);
                } else { //func is a param when ajax-submit execute
                    data = data || func;
                    executeContext = executeContext || data;
                    return avril.event._event.execute(fnName, executeContext, data);
                }
            }
            func.clear = function () {
                event._event.clear(fnName);
            }
            func.eventList = function () {
                return event._event.eventList[fnName];
            }
            func.execList = function () {
            }
            event._event[fnName] = func;
            return func;
        }

        event.registerOn = function (obj, fnName, executeContext) {
            var ns = avril.getHash(obj) + '_' + fnName;
            return this.register(ns, executeContext);
        }

        event.remove = function (fnName) {
            if (event._event[fnName])
                delete event._event[fnName];
        }

        event.clear = function (fnName) {
            event._event.clear(fnName);
        }

        function registerEvent(eventName, ns) {
            var ns = ns || guid + '[' + index + '].';
            var fullName = ns + eventName;
            if (!event._event[fullName])
                event.register(fullName);
            return event._event[fullName];
        }

        function hook(obj, funName, ns) {
            var before = before || 'before';
            var on = on || 'on';
            var _self = obj;
            var _func = _self[funName]
            , beforeName = _beautifyFunName(before, funName)
            , onName = _beautifyFunName(on, funName);

            if (typeof _self[funName] != 'function'
                || typeof (_self[funName][beforeName]) == 'function'
                || typeof (_self[funName][onName]) == 'function') {
                return _self;
            }

            var beforeFunc = registerEvent(beforeName, ns);
            var onFunc = registerEvent(onName, ns);
            _self[funName] = function () {
                var _self = this;
                if (beforeFunc(_self, arguments)) {
                    var result = _func.apply(_self, arguments);
                    var arr = [];
                    arr.push(result);
                    for (var i = 0; i < arguments.length; i++) {
                        arr.push(arguments[i]);
                    }
                    onFunc(_self, arr);
                    return result;
                }
                return false;
            }
            _self[funName]['_orgFunc'] = _func;
            _self[funName][beforeName] = beforeFunc;
            _self[funName][onName] = onFunc;
            for (var k in _func) {
                _self[funName][k] = avril.isFunc(_func[k]) ? _func[k].bind(_func) : _func[k];
            }
            return _self;
        }

        event.hook = function (obj, funNames, ns) {
            ns = ns || avril.getHash(obj);
            funNames.split(',').each(function (funName) {
                if (funName)
                    hook(obj, funName, ns);
            });
        };

        event.unhook = function (obj, funName) {
            if (obj[funName] && obj[funName]._orgFunc) {
                obj[funName] = obj[funName]._orgFunc;
            }
        }

        event.get = function (name, $obj) {
            if (!$obj) {
                $obj = window;
            }

            if ($obj.jquery) {

                $obj.each(function () {
                    event.registerOn(this, name, this, this);
                });

                return function () {
                    var args = arguments;
                    var result = true;
                    $obj.each(function () {
                        result = result && event.registerOn(this, name, this, this).apply(this, args);
                    });
                    return result;
                }

            }
            var ev = this.registerOn($obj, name, $obj, $obj);
            return ev;
        }

    })(avril.$, avril);

    //#endregion

    //#region avril.createlib & avril.extendlib

    (function (avril) {
        if (avril.createlib) {
            return avril.createlib;
        }

        /*
        avril.createlib('namespace.helloworld',function(options){
        var config = this.options(options);
        this.sayHello = function(){ alert('hello');}
        this.sayGoodbye = function(){ alert('good bye'); }

        this.hook('sayHello,sayGoodbye'); // hook is a inherited method will add on and before events on methods
        });
        create a Class named 'namespace.helloworld'
        var hw = namespace.helloworld({
        beforeSayHello:function () {  alert('before say hello 0 ;');}
        , onSayHello:function () { alert('on say hello 0 ;');}
        , beforeSayGoodbye:function () {  alert('before say goodbye 0 ;');}
        , onSayGoodbye : function(){  alert('on say goodbye 0 ;');}
        });

        hw.sayHello.beforeSayHello(function () {
        alert('before say hello 1.');
        })
        .onSayHello(function(){
        alert('on say hello 1.');
        });

        hw.sayGoodBye.beforeSayGoodbye(function(){
        alert('say goodbye 1');
        return false ; // this will stop sayGoodbye
        })
        .onSayGoodbye(function(){
        alert('on goodbye 1');// will no show
        });

        hw.sayHello(); // 'before say hello 0 , before say hello 1 , on say hello 0 , on say hello 1'

        hw.sayGoodbye(); // 'before say goodbye 0 , before say goodbye 1 '
        */
        var helper = {
            uperChar0: function (name) {
                var char0 = name.charAt(0);
                var r = char0.toUpperCase();
                return name.replace(new RegExp('^' + char0), r);
            }
            , lowerChar0: function (name) {
                var char0 = name.charAt(0);
                var r = char0.toLowerCase();
                return name.replace(new RegExp('^' + char0), r);
            }
        }

        , index = 0

        , _beautifyFunName = function () {
            var arr = [];
            if (arguments.length) {
                for (var i = 0; i < arguments.length; i++) {
                    arr.push(arguments[i]);
                }
            } else {
                return '';
            }
            if (arr[0]) {
                arr[0] = helper.lowerChar0(arr[0]);
            }
            for (var i = 1; i < arguments.length; i++) {
                arr[i] = helper.uperChar0(arr[i]);
            }
            return arr.join('');
        }

        , configCache = {}

        , _class = function (namespace, constructor, statics, base, obj) {
            ///<summary>
            /// you could do some init job in constructor
            /// statics methods
            ///</summary>
            obj = obj || window;
            if (avril.object(obj).tryGetVal(namespace)) {
                return avril.object(obj).tryGetVal(namespace);
                throw namespace + ' existed !';
            }

            avril.object(obj)
            .setVal(namespace, function (options) {
                index++;
                var fnType = avril.object(obj).getVal(namespace);
                if (!(this instanceof fnType)) {
                    return (new fnType(options));
                }

                var _self = this;

                if (base) {
                    if (avril.isStr(base)) {
                        base = avril.object(obj).getVal(base);
                    }
                    var _base = base(options);

                    avril.object(_base).each(function (key, value) {
                        _self[key] = value;
                    });

                    _self._getSuper = function () {
                        return _base;
                    }
                } else {
                    _self._getSuper = function () {
                        return null;
                    }

                    _self.events = {};

                    var guid = avril.guid()

                    , config = configCache[guid] = {}

                    , onPropertyChange = avril.event.register(namespace + '[' + index + '].onPropertyChange')

                    , beforePropertyChange = avril.event.register(namespace + '[' + index + '].beforePropertyChange');

                    bindOptionEvents(options, _self);

                    function registerEvent(eventName, _self) {
                        var events = _self.events;
                        var ns = namespace + '[' + index + '].';
                        if (!events[eventName])
                            events[eventName] = avril.event.register(ns + eventName, events);
                    }

                    function setOption(key, newConfig, oldConfig) {
                        var val = newConfig[key]
                        , preVal = oldConfig[key];
                        if (val != preVal) {
                            var res = beforePropertyChange([key, newConfig, oldConfig]);
                            if (res) {
                                oldConfig[key] = newConfig[key];
                                onPropertyChange([key, newConfig, oldConfig]);
                            }
                        }
                    }

                    _self.options = function (options, optionValue) {
                        if (arguments.length > 0) {
                            if (typeof options == 'object') {
                                for (var key in options) {
                                    setOption(key, options, config);
                                }
                            } else if (typeof options == 'string') {
                                var key = options
                                , options = {};
                                options[key] = optionValue;
                                setOption(key, options, config);
                            }
                            bindOptionEvents(options, this);
                            return this;
                        }

                        return config;
                    }

                    _self.events.beforeOptionChange = beforePropertyChange;

                    _self.events.onOptionChange = onPropertyChange;

                    function hook(_self, funName) {
                        avril.event.hook(_self, funName, namespace + '[' + index + '].');
                        var before = before || 'before'
                        , on = on || 'on'
                        , beforeName = _beautifyFunName(before, funName)
                        , onName = _beautifyFunName(on, funName);

                        _self.events[beforeName] = _self[funName][beforeName];
                        _self.events[onName] = _self[funName][onName];
                        return _self;
                    }

                    _self.hook = function (str) {
                        var _self = this;
                        if (typeof str == 'string') {
                            if (str.indexOf(',') >= 0) {
                                str.split(',').each(function (funName) {
                                    hook(_self, funName);
                                });
                            } else {
                                hook(_self, str);
                            }
                        }
                        return _self;
                    }

                    _self._prop = function (name, geter, seter) {
                        avril.createlib.getset(_self, name, geter, seter);
                    }

                    _self._parseConfig = function (jQContext) {
                        avril.createlib.parseConfig(_self, jQContext);
                    }
                }

                function bindOptionEvents(options, _self) {
                    if (!options) { return false; }
                    var events = _self.events;
                    for (var ev in options) {
                        if (events[ev] && typeof options[ev] == 'function') {
                            if (options.clearAllEvents == true) {
                                events[ev].clear();
                            }
                            events[ev](options[ev]);
                        }
                    }
                }

                /* constructor */

                if (typeof constructor == 'function') {
                    constructor.call(this, options);

                    bindOptionEvents(options, this);
                }

                /*end constructor*/
            });

            var type = avril.object(obj).getVal(namespace);

            var _instance;

            $.extend(type, statics);

            var __toString = type.toString;

            type.toString = function (org) {
                if (org) {
                    return __toString.call(type);
                }
                return 'type [ ' + namespace + ' ] ';
            }

            type.toJQ = function (name, optionSetter) {
                var fnName = name;
                name = name + "API";
                $.fn[fnName] = function (options) {
                    var args = arguments;
                    var self = this.each(function () {
                        var handle = $(this);
                        if (!handle.data(name)) {
                            var elOption = {};
                            if (typeof (optionSetter) == 'function') {
                                optionSetter.call(handle, elOption)
                            } else if (typeof optionSetter == 'string') {
                                elOption[optionSetter] = handle;
                            }
                            var instance = new type($.extend({}, options, elOption));
                            handle.data(name, instance);
                            if (typeof (instance.init) == 'function') {
                                instance.init();
                            }
                        } else {
                            var instance = handle.data(name);
                        }
                    });
                    if (this.length != 0 && this.data(name)) {
                        var instance = this.data(name);
                        if (args.length == 1) {
                            if (typeof args[0] == 'string') {
                                return instance[args[0]];
                            }
                        } else if (args.length > 1) {
                            if (typeof args[0] == 'string' && instance[args[0]]) {
                                if (typeof instance[args[0]] == 'function') {
                                    var arr = [];
                                    for (var i = 1; i < args.length ; i++) {
                                        arr.push(args[i]);
                                    }
                                    return instance[args[0]].apply(instance, arr);
                                } else {
                                    instance[args[0]];
                                }
                            }
                        }
                    }
                    return this;
                }
            }

            fnName = namespace.replace(new RegExp('\\.', 'gi'), '_');

            if (!$.fn[fnName]) {
                $.fn[fnName] = function (options) {
                    this.each(function () {
                        var handle = $(this)
                        , config = $.extend({ $: handle }, options)
                        , instance = type(config);

                        handle.data(namespace, instance);
                    });
                    return this;
                }
            }

            return type;
        }

        , _extend = function (base, namespace, constructor, statics, obj) {
            var type = avril.createlib(namespace, constructor, statics, base, obj);

            return type;
        };

        avril.createlib = _class;
        avril.createlib.getset = function (ins, name, geter, seter) {
            ins[name] = (function (ins, name, geter, seter) {
                var cahce = { value: undefined };
                return function () {
                    if (arguments.length == 0) {
                        if (avril.isFunc(geter)) {
                            return geter.call(cahce, cahce.value);
                        }
                        return cahce.value;
                    } else {
                        if (avril.isFunc(seter)) {
                            seter.call(cahce, arguments[0]);
                        } else {
                            cahce.value = arguments[0];
                        }
                        return ins;
                    }
                }
            })(ins, name, geter, seter);
        }
        avril.createlib.parseConfig = function (avrilObj, jQContext) {
            avril.object(avrilObj.options()).each(function (key, value) {
                if (key.indexOf('$') == 0) {
                    if (!avrilObj[key]) {
                        var cache, oldKey = avril.guid();
                        avril.createlib.getset(avrilObj, key, function () {
                            if (oldKey != avrilObj.options()[key]) {
                                oldKey = avrilObj.options()[key];
                                cache = (jQContext || $)(avrilObj.options()[key]);
                            }
                            return cache;
                        }, function (value) {
                            avrilObj.options(key, value);
                        });
                    }
                }
            });
        }
        avril.createlibOn = function (obj, namespace, constructor, statics, base) {
            return avril.createlib(namespace, constructor, statics, base, obj);
        }

        avril.extendlib = _extend;

        avril.createlib.beautifyFunName = _beautifyFunName;

        //overrided avril.object.instanceOf
        (function () {
            var __instanceOf = avril.object.instanceOf;
            avril.object.instanceOf = function (obj, type) {
                var res = obj instanceof type;
                if (res) {
                    return true;
                }
                if (avril.isFunc(obj._getSuper)) {
                    var base = obj._getSuper();
                    res = base instanceof type;
                    if (res) {
                        return true;
                    }
                    if (base != null) {
                        return avril.object(base).instanceOf(type);
                    }
                }
                return res;
            }
        })();
    })(avril);

    //#endregion

    //
    if (!window.console) {
        window.console = {};
        window.console.log = function () { };
    }
})(this);
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

/// <reference path="../_reference.js" />
(function ($) {
    if (!$.validator) { return false; }

    avril.namespace('avril.validator');

    (function () {
        var orgShowLabel = $.validator.prototype.showLabel;

        $.validator.prototype.showLabel = function (element) {
            var errElements = orgShowLabel.apply(this, arguments);
            this.errorsFor(element).addClass('help-block');
            return errElements;
        }
    })();

    avril.validator.extend({
        parseForm: function ($form) {
            var self = this;
            $form = $($form);
            $form.each(function () {
                $.data(this, 'validator', null);
                $(this).validate(self.getValidObj($(this)));
            });
            return this;
        }
        , getValidObj: function ($form, validCfg) {
            var cfg = validCfg
            , errorCls = cfg && cfg.errCls || 'has-error'
            , successCls = cfg && cfg.errCls || 'has-success'
            ;

            if (!cfg) {
                cfg = {
                    rules: {}
                    , errorElement: 'small'
                    , messages: {}
                    , success: function (label) {
                        $(label).parent().removeClass(errorCls).addClass(successCls);
                        label.remove();
                        label.addClass('help-block');
                    }
                    , errorPlacement: function (label, $el) {
                        $($el).after(label);
                        label.addClass('help-block');
                        label.hide();
                        $($el).parent().removeClass(successCls).addClass(errorCls);
                    }
                };
            }

            var self = this;
            $form.find('input,select,textarea').each(function () {
                self.parseInput($(this), cfg);
            });
            return cfg;
        }
        , parseInput: function ($input, validCfg) {
            var self = this
            , inputName = $input.attr('name')
            , input = $input[0]
            , attrs = input.attributes
            , attrArr = []
            , pre = 'data-val-';

            if (!inputName) {
                $input.attr('name', inputName = ('input-name-' + avril.getHash($input)));
            }

            if ($input.attr('data-val')==='true' && $input.is(':enabled')) {
                if (!validCfg.rules[inputName]) { validCfg.rules[inputName] = {}; }
                if (!validCfg.messages[inputName]) { validCfg.messages[inputName] = {}; }
                for (var i = 0; i < attrs.length; i++) {
                    attrArr.push(attrs[i]);
                }
                var dataValAttrs = attrArr.each(function (attr) {
                    var name = attr.name;
                    if (attr.name.indexOf(pre) >= 0) {
                        var methodName = self._getOrgAttrName(name.replace(pre, ''));
                        if (methodName.indexOf('-') < 0) {
                            var ruleMessage = $input.attr('data-val-msg-' + methodName) || $input.attr(name);

                            validCfg.messages[inputName][methodName] = ruleMessage;

                            self._getRuleParam($input, name, methodName, attrArr, validCfg);

                            if (!validCfg.rules[inputName][methodName]) {
                                validCfg.rules[inputName][methodName] = true;
                            }
                        }
                    }
                });
            }
        }
        , _getOrgAttrName: function (attrName) {
            var adapter = {
                'equalto': 'equalTo',
                dateiso: 'dateISO'
            };

            return adapter[attrName] || attrName;
        }
        , _getRuleParam: function ($input, methodPath, methodName, dataValAttrs, validCfg) {
            var inputName = $input.attr('name');
            var self = this;
            dataValAttrs.each(function (attr) {
                if (attr.name.indexOf(methodPath) == 0) {
                    validCfg.rules[inputName][methodName] = self._paramAdapter[methodName] ? self._paramAdapter[methodName]($input.attr(attr.name), $input) : $input.attr(attr.name);
                }
            });


        }
        , _paramAdapter: {
            required: function () {
                return true;
            }
            , range: function (attr, $el) {
                return attr.split(',').select(function () {
                    return Number(this);
                });
            }
            , rangelength: function (attr, $el) {
                return attr.split(',').select(function () {
                    return Number(this);
                });
            }
        }
    });

    $.each(['minlength', 'maxlength', 'min', 'max'], function () {
        avril.validator._paramAdapter[this] = function (attr, $input) {
            return Number(arguments[0]);
        }
    });



})(jQuery);
/// <reference path="avril.js" />
/// <reference path="avril.tools.js" />


(function (avril) {
    String.prototype.localize = function () {
        return $(avril.ui.helper.$span().html(this.toString()).localize())[0].outerHTML;
    }
    avril.toArray = function (arg) {
        var arr = [];
        if (arg.length) {
            for (var i = 0; i < arg.length; i++) {
                arr.push(arg[i]);
            }
        }
        return arr;
    }
})(avril);


avril.namespace('avril.ui');

//#region avril.ui.helper
(function (avril) {
    var datakey = 'localizeKey';

    $.fn.localize = function (group) {
        var self = this;

        this.data(datakey, this.data(datakey) || this.html());

        this.attr('data-localize', 'false');

        if (group) {
            this.attr('data-loaclize-group', group);
        }

        avril.tools.localize.parse(self);

        return this;
    }

    var helper = avril.ui.helper = {
        divStr: '<div/>'
                , linkStr: '<a/>'
                , tagBuilder: function (tag, attrs) {
                    var $el = $(this.tagStr[tag]);
                    if (attrs) {
                        $el.attr(attrs);
                    }
                    return $el;
                }
                , localize: {}
                , tagStr: {}
    };

    //#region tags
    var tags = 'a,abbr,acronym,address,applet,area,b,base,basefont,bdo,big,blockquote,body,br,button,canvas,caption,center,cite,code,col,colgroup,dd,del,dfn,dir,div,dl,dt,em,fieldset,font,form,frame,frameset,h1,h2,h3,h4,h5,h6,head,hr,html,i,iframe,img,input,ins,isindex,kbd,label,legend,li,link,map,menu,meta,noframes,noscript,object,ol,optgroup,option,p,param,pre,q,s,samp,script,select,small,span,strike,strong,style,sub,sup,table,tbody,td,textarea,tfoot,th,thead,title,tr,tt,u,ul,var';
    //#endregion

    tags.split(',').each(function (tag) {
        var fnName = '$' + tag;
        helper.tagStr[tag] = '<' + tag + '/>';
        helper[fnName] = function (attrs) {
            return helper.tagBuilder(tag, attrs);
        }
        helper.localize[fnName] = function (options, group) {
            var $el = helper[fnName].apply(helper, arguments);
            $el.localize(group);
            return $el;
        }
    });

    (function special() {
        var org$a = helper.$a;
        helper.$a = function (attrs) {
            if (!attrs || !attrs.href) {
                attrs = attrs || {};
                attrs.href = 'javascript:;';
            }
            org$a.call(helper, attrs);
        }
    })();
})(avril);
//#endregion

//#region avril.ui.msg
(function ($, avril) {
    avril.createlib('avril.ui.msg', function (options) {
        var config = $.extend(true, this.options(), {
            $container: 'body'
        }, options)
        , generateMsg = function () {
            $msg = $('<div class="alert" style="display:none;"> <button type="button" class="close" data-dismiss="alert">×</button> <strong/>:  <span/>  </div>').attr('guid', avril.guid());
            $msg.find('button').click(function () {
                $msg.fadeOut();
            });
        }
        , $msg;

        this._parseConfig();

        function setMsg($msg, msg) {
            $msg.show();
            $msg.removeClass('alert-success alert-error alert-info').addClass('alert-' + msg.type);
            $msg.find('strong').html(msg.title);
            $msg.find('span').html(msg.msg);
        }

        this.show = function ($container, msg) {
            if (arguments.length == 1) {
                msg = arguments[0];
                $container = this.$container();
            } else if (arguments.length == 2) {
                config.$container = $container;
            }
            if ($container.children('div.alert').length == 0) {
                generateMsg();
                $msg.prependTo($container);
            } else {
                $msg = $container.find('div.alert');
            }
            setMsg($msg, msg);
            return this;
        }

        this.showInBody = function (msg) {
            config.$container = 'body';
            this.show('body', msg);
            return this;
        }
    });
})(jQuery, avril);
//#endregion

//#region avril.ui.pop
(function ($, avril) {
    //#region private
    var popList = []
    , _divStr = '<div style="display:none;" class="row"><div class="modal-backdrop fade in"></div> \
                 <div class="modal"> \
                  <div class="modal-header"> \
                    <button type="button" class="close">×</button> \
                    <h3>Untitle</h3> \
                  </div> \
                  <div class="modal-body"> \
                    \
                  </div> \
                </div></div>';
    //#endregion

    avril.createlib('avril.ui.pop', function (options) {
        var config = $.extend(this.options(), {
            autoSize: true
            , $handle: null
            , draggable: false
            , resizable: true
            , effect: 'puff'
            , effectTime: 250
            , easing: 'easeInExpo'
            , title: ''
            , esc: true
        }, options)
        , disabled = false
        , self = this
        , $modal = function () {
            return self.$pop().find('.modal')
        }
        , $body = function () {
            return $modal().find('.modal-body');
        }
        , $header = function () {
            return $modal().find('.modal-header');
        };

        this._parseConfig($);

        this.$modal = $modal;

        this.$body = $body;

        this.$header = $header;

        this.$pop = function ($pop) {
            if ($pop) {
                this._$pop = $pop;
            }
            return $(this._$pop);
        }

        this.init = function () {
            if (!this._inited) {

                var $pop = this.$pop($(_divStr).appendTo('body'));

                initHandle(this.$handle());

                initDraggable();

                initResizable();

                initSize(config.width, config.height);

                initTitle(config.title);

                self.events.onLoadHandle(function () {
                    $body().find('.close-pop').click(function () {
                        self.hide();
                    });
                    initSize(config.width, config.height);
                });

                this._inited = true;
            }
            return this;
        }

        this.load = function (url, callback) {
            function onLoaded(res) {

                if (self.events.onLoad([res])) {

                    self.$pop().find('div.modal-body').html(res);

                    var $title = self.$pop().find('.modal-body h3:eq(0)').hide();

                    self.$pop().find('.modal-header h3:eq(0)').html($title.html());

                    self.events.onLoadHandle([self.$pop(), self]);

                    self.events.onContentReady([]);

                    if (callback) { callback(); };
                }

            }

            this.events.beforeLoad([self]) && $.ajax({
                url: url
                , success: onLoaded
                , error: function () {
                    self.hide();
                }
            });
        }

        this.show = function () {

            popList.push(this);

            this.init();

            this.$pop().show();

            this.$pop().find('.modal-backdrop').css('z-index', avril.ui.getZindex() + 2).css('opacity', 0.6);

            this.$pop().find('.modal').hide()
                .show(config.effect, { to: self.$handle(), easing: config.easing }, config.effectTime, function () {

                    self.$pop().find('.modal-backdrop').css('z-index', avril.ui.getZindex() + 1)

                    self.$pop().find('.modal').css('z-index', avril.ui.getZindex() + 1);

                    makePositionCenter();
                });

            this.$pop().find('.close,.close-pop,button[type=reset]').click(function () {
                self.hide();
            });
        }

        this.hide = function () {

            popList.remove(function (item) { return item == self; });

            this._inited = false;

            this.$pop().find('.modal').hide(config.effect, { to: self.$handle(), easing: config.easing }, config.effectTime, function () {
                self.$pop().remove();
            });
        }

        this.disable = function () {
            disabled = true;
        }

        //private
        var initHandle = function ($handle) {
            if ($handle && $handle.length) {
                var href = $handle.attr('href')
                    , isEl = false;

                if (href.indexOf('#') > 0) {
                    config.$pop = href.substring(href.indexOf('#'));
                    isEl = true;
                }

                $handle.click(function (e) {
                    e.preventDefault();
                    if (!isEl) { self.load($(this).attr('href')); }
                    self.show();
                });
            }
        }

        var initDraggable = function () {
            self.$pop().find('.modal').draggable({ handle: ".modal-header h3" });
            if (!config.draggable) {
                self.$pop().find('.modal').css({
                    'position': 'fixed'
                });
                self.$pop().find('.modal').draggable('disable');
                self.$pop().find('.modal h3').css({ cursor: 'default' });
                self.$pop().find('.modal').removeClass('ui-state-disabled');
            } else {
                self.$pop().find('.modal').draggable('enable');
                self.$pop().find('.modal').css({
                    'position': 'absolute'
                });
                self.$pop().find('.modal h3').css({ cursor: 'move' });
            }
            makePositionCenter();
        }

        var initResizable = function () {
            self.$pop().find('.modal').resizable();
            if (!config.resizable) {
                self.$pop().find('.modal').resizable('disable');
                self.$pop().find('.modal').removeClass('ui-state-disabled');
            }
        }

        var initSize = function (width, height) {
            if (width !== undefined) {
                $modal().width(width);
            }
            if (height !== undefined) {
                $modal().height(height);
            }

        }

        var initTitle = function (title) {
            return $header().find('h3').html(title);
        }

        var makePositionCenter = function () {
            var $popWin = self.$pop().find('.modal')
                , winHeight = $(window).height()
                , winWidth = $(window).width()
                , popWidth = $popWin.width()
                , popHeight = $popWin.height();


            var top = 0, left = 0;

            if (winHeight > popHeight) {
                top = (winHeight - popHeight) / 2 + (config.draggable ? $(window).scrollTop() : 0);
            }

            if (winWidth > popWidth) {
                left = (winWidth - popWidth) / 2
            }

            $popWin.clearQueue().animate({
                top: top + 'px'
                , left: left + 'px'
            });

        }

        this.makePositionCenter = makePositionCenter;

        self.hook('show,hide');

        this.events.beforeLoad = avril.event.get('beforeLoad', this);

        this.events.onLoad = avril.event.get('onLoad', this);

        this.events.onLoadHandle = avril.event.get('onLoadHandle', this);

        this.events.onContentReady = avril.event.get('onContentReady', this);

        this.events.onHide = avril.event.get('onHide', this);

        this.events.onOptionChange(function (key, newConfig, oldConfig) {
            switch (key) {
                case 'content': {
                    self.$pop().find('.modal-body').html(newConfig[key]);
                    avril.tools.localize.parse(self.$pop());
                    self.events.onLoadHandle([self.$pop(), self]);
                    self.events.onContentReady([]);
                    break;
                }
                case 'title': {
                    initTitle(newConfig[key]);
                    break;
                }
                case 'width': {
                    initSize(newConfig[key]);
                    break;
                }
                case 'height': {
                    initSize(undefined, newConfig[key]);
                    break;
                }
                case 'draggable': {
                    initDraggable();
                    break;
                }
                case 'resizable': {
                    initResizable();
                }
            }
        });

        this.show.onShow(function () {
            setTimeout(makePositionCenter, 700);
            $body().on('keyup', 'input,textarea,select', function (e) {
                e.stopPropagation();
            });
        });

        $(window).resize(makePositionCenter);
    });

    function initDialog(pop) {
        if (pop.options().buttons) {
            var self = pop, config = pop.options(), $footer = function () {
                var $footer = pop.$pop().find('.modal-footer');

                if (!$footer.length) {
                    pop.$pop().find('.modal-body').after($('<div class="modal-footer"></div>'));
                    $footer = pop.$pop().find('.modal-footer');
                }

                return $footer;
            };

            pop.onButtonClick = avril.event.get('onButtonClick', pop);

            if (config.buttons) {
                var $buttonArea = $footer();
                $buttonArea.html('');
                config.buttons.each(function (obj) {
                    var name = obj;
                    var text = obj;
                    var cls = 'btn';
                    if (typeof obj == 'object') {
                        name = obj.name;
                        text = obj.text;
                        cls = obj.cls = obj.cls || 'btn';
                        if (typeof obj.fun == 'function') {
                            self.onButtonClick(function (n, el) {
                                if (n == name) {
                                    obj.fun(n, el);
                                }
                            });
                        }
                    }
                    $('<a href="javascript:;"/>').addClass(cls).html(text).localize()
                        .attr('data-btn-name',name)
                    .click(function () {
                        self.onButtonClick([name, $(this)]);
                    }).appendTo($buttonArea);

                });
            }

            pop.$pop().find('.modal').css('min-height', 'none');
        }
    }

    avril.alert = function (msg, func) {
        func = func || function () { }
        var $alert = avril.ui.pop({
            resizable: false
            , alert: 'Alert'
            , title: 'Alert'
            , buttons: [
                { text: avril.alert.text['OK'] || 'OK', name: 'OK', cls: 'btn btn-primary' }
            ]
            , showFooter: true
        }).init();

        $alert.$header().find('h3').html( avril.alert.text['Alert'] || 'Alert' );

        initDialog($alert);

        $alert.options('content', msg).show();
        $alert.onButtonClick(function (name, el) {
            func();
            $alert.hide();
        });
        $alert.$pop().find('a:eq(0)').focus();
    }
    avril.alert.text = {
        OK:'确定'
        , 'Alert':'警告'
    };

    avril.confirm = function (msg, func) {
        func = func || function () { }
        var $confirm = avril.ui.pop({
            resizable: false
            , title: 'Confirm'
            , buttons: [
                 { text: avril.confirm.text['Confirm'] || 'Confirm', name: 'Confirm', cls: 'btn btn-primary' },
                 { text: avril.confirm.text['Cancel'] || 'Cancel', name: 'Cancel', cls: 'btn btn-danger' },
            ]
            , showFooter: true
        }).init();

        $confirm.$header().find('h3').html( avril.confirm.text['Confirm'] || 'Confirm' );

        initDialog($confirm);

        $confirm.options('content', msg).show();
        $confirm.show.onShow(function(){
            $confirm.$pop().find('[data-btn-name="Confirm"]').focus();
        });
        $confirm.onButtonClick(function (name, $el) {
            switch (name) {
                case 'Confirm': {
                    func(true);
                    $confirm.hide();
                    break;
                }
                case 'Cancel': {
                    func(false);
                    $confirm.hide();
                    break;
                }
            }
        });
        $confirm.$pop().find('a:eq(0)').focus();
    }

    avril.confirm.text = {
        'Confirm':'确认'
        , 'Cancel':'取消'
    };

    avril.prompt = function (msg, func, defaultValue) {
        func = func || function () { }
        var $confirm = avril.ui.pop({
            resizable: false
            , title: 'Prompt'
            , buttons: [
                 { text: 'Ok', name: 'Ok', cls: 'btn btn-primary' },
                 { text: 'Cancel', name: 'Cancel', cls: 'btn btn-danger' },
            ]
            , showFooter: true
        }).init();
        $confirm.$header().find('h3').localize()
        initDialog($confirm);
        $confirm.options('content', msg + '<br/><br/><input class="input-xxlarge" value="' + (defaultValue || '') + '" /> ').show();

        function ok() {
            var res = func($confirm.$body().find('input').val()) !== false;
            if (res) $confirm.hide();
        }

        $confirm.$pop().find('input').keyup(function (e) {
            e.keyCode == 13 && ok();
        });
        $confirm.onButtonClick(function (name, $el) {
            switch (name) {
                case 'Ok': {
                    ok();
                    break;
                }
                case 'Cancel': {
                    $confirm.hide(false);
                    break;
                }
            }
        });
    }

    avril.ui.pop.open = function (url) {
        var pop = new avril.ui.pop();
        pop.load(url); pop.show()
    }

    avril.ui.pop.toJQ('pop', function (options) {
        if (this.attr('data-pop')) {
            try {
                $.extend(true, options, eval('(' + this.attr('data-pop') + ')'));
            }
            catch (E) { }
        }
        options.$handle = this;
    });

    avril.ui.popContext = {
        popList: function () {
            return popList;
        }
        , getCurrent: function () {
            return popList && popList.length ? popList[popList.length - 1] : null;
        }
    };

    $(window).keyup(function (e) {
        if (e.keyCode == 27) {
            var currentPop = avril.ui.popContext.getCurrent();
            if (currentPop && currentPop.options().esc) {
                currentPop.hide();
            }
        }
    });
})(jQuery, avril);
//#endregion

//#region avril.cookie
(function (avril) {
    avril.namespace('avril.ui');
    avril.ui.cookie = {
        get: function (name) {
            var arr = document.cookie.match(new RegExp("(^| )" + name + "=([^;]*)(;|$)"));
            if (arr != null) return unescape(arr[2]); return null;
        }
        , set: function (name, value, days) {
            days = days || 30;
            var exp = new Date();
            exp.setTime(exp.getTime() + days * 24 * 60 * 60 * 1000);
            document.cookie = name + "=" + escape(value) + ";expires=" + exp.toGMTString();
        }
        , del: function (name) {
            var exp = new Date();
            exp.setTime(exp.getTime() - 1);
            var cval = this.get(name);
            if (cval != null) document.cookie = name + "=" + cval + ";expires=" + exp.toGMTString();
        }
        , getObj: function (key) {
            return window.JSON ? window.JSON(this.get(key)) : eval('(' + this.get(key) + ')');
        }
        , setObj: function (key, obj) {
            this.set(key, window.JSON ? window.JSON.stringify(obj) : $.toJSON(obj));
        }
    };
})(avril);
//#endregion

//#region avril.ui.progressbar
(function ($, avril) {
    avril.createlib('avril.ui.progressbar', function (options) {
        var config = $.extend(true, this.options(), {
            auto: true
            , stop: false
        }, options)
        , $el = avril.ui.helper.$div().css({
            width: config.width || 250
            , height: config.height || 20
            , position: config.position || 'fixed'
            , bottom: config.bottom || 0
            , right: config.right || 0
            , display: 'none'
        }).appendTo('body')
        , self = this
        , guid = avril.guid()
        , interval;

        $el.progressbar();

        function run() {

            stop();

            config.stop = false;
            var i = 0;
            interval = setInterval(function () {
                if (i++ == 100) {
                    i = 0;
                }
                if (!config.stop) {
                    $el.progressbar("value", i);
                    $el.css('z-index', avril.ui.getZindex() + 2);
                }
            }, 50);
        }

        function stop() {
            config.stop = true;
            try {
                clearInterval(interval);
            } catch (E) { }
        }

        if (config.auto) {
            run();
        }

        this.show = function () {

            $el.show();
            run();
            return this;
        }

        this.hide = function () {
            $el.hide();
            stop();
            return this;
        }

        this.$el = $el;
    }, {
        bottom_right: (function () {
            var ins;
            return function () {
                if (!ins) {
                    ins = avril.ui.progressbar();
                }
                return ins;
            }
        })()
    });
})(jQuery, avril);
//#endregion

//#region avril.ui.ajaxFrame
(function ($, avril) {
    //#region jquery.hashchange
    (function ($, window, undefined) {
        '$:nomunge'; // Used by YUI compressor.

        // Reused string.
        var str_hashchange = 'hashchange',

    // Method / object references.
    doc = document,
    fake_onhashchange,
    special = $.event.special,

    // Does the browser support window.onhashchange? Note that IE8 running in
    // IE7 compatibility mode reports true for 'onhashchange' in window, even
    // though the event isn't supported, so also test document.documentMode.
    doc_mode = doc.documentMode,
    supports_onhashchange = 'on' + str_hashchange in window && (doc_mode === undefined || doc_mode > 7);

        // Get location.hash (or what you'd expect location.hash to be) sans any
        // leading #. Thanks for making this necessary, Firefox!
        function get_fragment(url) {
            url = url || location.href;
            return '#' + url.replace(/^[^#]*#?(.*)$/, '$1');
        };

        $.fn[str_hashchange] = function (fn) {
            return fn ? this.bind(str_hashchange, fn) : this.trigger(str_hashchange);
        };

        $.fn[str_hashchange].delay = 50;

        // Override existing $.event.special.hashchange methods (allowing this plugin
        // to be defined after jQuery BBQ in BBQ's source code).
        special[str_hashchange] = $.extend(special[str_hashchange], {
            // Called only when the first 'hashchange' event is bound to window.
            setup: function () {
                // If window.onhashchange is supported natively, there's nothing to do..
                if (supports_onhashchange) { return false; }

                // Otherwise, we need to create our own. And we don't want to call this
                // until the user binds to the event, just in case they never do, since it
                // will create a polling loop and possibly even a hidden Iframe.
                $(fake_onhashchange.start);
            },

            // Called only when the last 'hashchange' event is unbound from window.
            teardown: function () {
                // If window.onhashchange is supported natively, there's nothing to do..
                if (supports_onhashchange) { return false; }

                // Otherwise, we need to stop ours (if possible).
                $(fake_onhashchange.stop);
            }
        });

        // fake_onhashchange does all the work of triggering the window.onhashchange
        // event for browsers that don't natively support it, including creating a
        // polling loop to watch for hash changes and in IE 6/7 creating a hidden
        // Iframe to enable back and forward.
        fake_onhashchange = (function () {
            var self = {},
      timeout_id,

      // Remember the initial hash so it doesn't get triggered immediately.
      last_hash = get_fragment(),

      fn_retval = function (val) { return val; },
      history_set = fn_retval,
      history_get = fn_retval;

            // Start the polling loop.
            self.start = function () {
                timeout_id || poll();
            };

            // Stop the polling loop.
            self.stop = function () {
                timeout_id && clearTimeout(timeout_id);
                timeout_id = undefined;
            };

            // This polling loop checks every $.fn.hashchange.delay milliseconds to see
            // if location.hash has changed, and triggers the 'hashchange' event on
            // window when necessary.
            function poll() {
                var hash = get_fragment(),
        history_hash = history_get(last_hash);

                if (hash !== last_hash) {
                    history_set(last_hash = hash, history_hash);

                    $(window).trigger(str_hashchange);
                } else if (history_hash !== last_hash) {
                    location.href = location.href.replace(/#.*/, '') + history_hash;
                }

                timeout_id = setTimeout(poll, $.fn[str_hashchange].delay);
            };

            // vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv
            // vvvvvvvvvvvvvvvvvvv REMOVE IF NOT SUPPORTING IE6/7/8 vvvvvvvvvvvvvvvvvvv
            // vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv
            $.browser.msie && !supports_onhashchange && (function () {
                // Not only do IE6/7 need the "magical" Iframe treatment, but so does IE8
                // when running in "IE7 compatibility" mode.

                var iframe,
        iframe_src;

                // When the event is bound and polling starts in IE 6/7, create a hidden
                // Iframe for history handling.
                self.start = function () {
                    if (!iframe) {
                        iframe_src = $.fn[str_hashchange].src;
                        iframe_src = iframe_src && iframe_src + get_fragment();

                        // Create hidden Iframe. Attempt to make Iframe as hidden as possible
                        // by using techniques from http://www.paciellogroup.com/blog/?p=604.
                        iframe = $('<iframe tabindex="-1" title="empty"/>').hide()

            // When Iframe has completely loaded, initialize the history and
            // start polling.
            .one('load', function () {
                iframe_src || history_set(get_fragment());
                poll();
            })

            // Load Iframe src if specified, otherwise nothing.
            .attr('src', iframe_src || 'javascript:0')

            // Append Iframe after the end of the body to prevent unnecessary
            // initial page scrolling (yes, this works).
            .insertAfter('body')[0].contentWindow;

                        // Whenever `document.title` changes, update the Iframe's title to
                        // prettify the back/next history menu entries. Since IE sometimes
                        // errors with "Unspecified error" the very first time this is set
                        // (yes, very useful) wrap this with a try/catch block.
                        doc.onpropertychange = function () {
                            try {
                                if (event.propertyName === 'title') {
                                    iframe.document.title = doc.title;
                                }
                            } catch (e) { }
                        };
                    }
                };

                // Override the "stop" method since an IE6/7 Iframe was created. Even
                // if there are no longer any bound event handlers, the polling loop
                // is still necessary for back/next to work at all!
                self.stop = fn_retval;

                // Get history by looking at the hidden Iframe's location.hash.
                history_get = function () {
                    return get_fragment(iframe.location.href);
                };

                // Set a new history item by opening and then closing the Iframe
                // document, *then* setting its location.hash. If document.domain has
                // been set, update that as well.
                history_set = function (hash, history_hash) {
                    var iframe_doc = iframe.document,
          domain = $.fn[str_hashchange].domain;

                    if (hash !== history_hash) {
                        // Update Iframe with any initial `document.title` that might be set.
                        iframe_doc.title = doc.title;

                        // Opening the Iframe's document after it has been closed is what
                        // actually adds a history entry.
                        iframe_doc.open();

                        // Set document.domain for the Iframe document as well, if necessary.
                        domain && iframe_doc.write('<script>document.domain="' + domain + '"</script>');

                        iframe_doc.close();

                        // Update the Iframe's hash, for great justice.
                        iframe.location.hash = hash;
                    }
                };
            })();
            // ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
            // ^^^^^^^^^^^^^^^^^^^ REMOVE IF NOT SUPPORTING IE6/7/8 ^^^^^^^^^^^^^^^^^^^
            // ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

            return self;
        })();
    })(jQuery, this);
    //#endregion

    avril.createlib('avril.ui.ajaxframe', function (options) {
        var config = $.extend(this.options(), {
            identifyPre: '#/'
            , $container: '#ajax-container'
            //, effect: 'clip'
            , showEffect: 'slide'
            , hideEffect: 'slide'
            , enabled: true
            , cache: false
        }, options)
        , self = this
        , _firstContent
        , cache = {}
        , triggerChange = true;

        this._parseConfig();

        function _isAjaxHash() {
            var hash = window.location.hash;
            if (hash.indexOf(config.identifyPre) == 0) {
                return true;
            }
            return false;
        }

        function _getUrl() {
            return window.location.hash.substring(1);
        }

        function _getCache(url) {
            return cache[url || _getUrl()];
        }

        function setContent(html, hasEffect) {
            if (hasEffect != false) {
                self.$container()
                .hide(config.hideEffect || config.effect, function () {
                    self.$container().html(html);
                    self.onLoad([self, self.$container()]);

                    self.$container().show(config.showEffect || config.effect);
                });
            } else {
                self.$container().html(html);
                self.onLoad([self, self.$container()]);
            }
        }

        function loadContent(url, hasEffect) {
            self._lasturl = url;
            if (!_getCache(url) || !config.cache) {
                $.ajax({
                    url: url
                    , data: { _avril_guid: avril.guid() }
                    , success: function (response) {
                        var isJSON = false, obj;
                        try {
                            var json = $('<div/>').html(response).text();
                            obj = eval('(' + json + ')');
                            isJSON = true;
                        }
                        catch (E) { }
                        if (isJSON) {
                            if (response.innerType) {
                                avril[response.innerType](response.msg, function () {
                                    avril.event.get('response.' + response.innerType)(avril.toArray(arguments).push(url));
                                });
                            } else {
                                avril.ui.msg().show('body>div.container.main-page', obj);
                            }
                        }
                        else {
                            cache[url] = response;
                            setContent(response, hasEffect);
                        }
                    }
                });
            } else if (config.cache && _getUrl(url)) {
                setContent(_getCache(url));
            }
        }

        this.loadContent = loadContent;

        this.onLoad = avril.event.get('onLoad', this);

        this.reload = function () {
            if (self._lasturl) {
                this.loadContent(self._lasturl, false);
            }
            return this;
        }

        this.beforeLoad = avril.event.get('beforeLoad', this);

        this.navTo = function (url) {
            if (this.options().enabled) {
                window.location = '#' + url;
                triggerChange = false;
                this.loadContent(url);
            }
        }

        this.parseLink = function (links) {
            $(links).each(function () {
                if (!$(this).data('ajaxframe-parse') && !$(this).is('.no-ajax')) {
                    $(this).click(function (e) {
                        if (self.options().enabled) {
                            e.preventDefault();
                            self.navTo($(this).attr('href'));
                        }
                    });
                    $(this).data('ajaxframe-parse', true)
                }
            });
        }

        this.init = function () {
            _firstContent = this.$container().html();
            $(window).hashchange(function () {
                if (self.options().enabled) {
                    if (triggerChange && _isAjaxHash()) {
                        self.loadContent(_getUrl());
                    } else if (triggerChange && !window.location.hash) {
                        setContent(_firstContent);
                    }
                }

                triggerChange = true;
            });
            if (_isAjaxHash() && self.options().enabled) {
                self.loadContent(_getUrl(), false);
            }
            this.parseLink('a.ajaxlink');
        }

        this.getUrl = function () {
            return _getUrl();
        }
    });

    window.ajaxFrame = avril.ui.ajaxframe();
})(jQuery, avril);
//#endregion

//#region avril.ui.getZindex 
(function () {
    avril.ui.getZindex = function () {
        var elArr = $('*').toArray();

        var zIndex = elArr.select(function (el) {
                var zIndex = $(el).css('z-index');
                if (zIndex && !isNaN(zIndex)) {
                    return parseInt(zIndex);
                }
                return 0;
        }).sort().pop();

        return zIndex;
    }
})();
//#endregion

//#region avril loading cover
(function ($) {

    avril.namespace('avril.ui.loadingCover');

    avril.ui.loadingCover.removeAll = avril.event.register('avril.ui.loadingCover.removeAll');

    avril.ui.loadingCover.hideAll = avril.event.register('avril.ui.loadingCover.hideAll');

    function loadingCover(options) {
        var handle = $(this);
        if (!handle.data('loadingCover')) {
            var divStr = '<div/>'
            , $cover = $(divStr).css({
                position: 'absolute'
            }).addClass('loading-cover')
            , $mask = $(divStr).addClass('mask').appendTo($cover)
            , $img = $(divStr).addClass('loading-img').appendTo($cover)
            , adjustAlwaysVisible = function () {
                var $win = $(window)
                    , winHeigth = $win.height()
                    , winWidth = $win.width();
                $img.css({
                    'top': '50%'
                     , 'position': 'fixed'
                });
            }
            , adjustCover = function () {
                $cover.css({
                    width: handle.width()
                    , height: handle.height()
                    , top: handle.offset().top
                    , left: handle.offset().left
                    , 'z-index': avril.ui.getZindex() + 1
                });
                $img.css({
                    'left': handle.width() / 2 - 16
                    , 'top': handle.height() / 2 - 16
                })
            }
            , api = {
                adjust: adjustCover
                , remove: function () {
                    $cover.remove();
                    handle.data('loadingCover', null);
                }
                , hide: function () {
                    $cover.hide();
                }
                , show: function () {
                    adjustCover();
                    $cover.show();
                }
                , cover: function () {
                    return $cover;
                }
            };
            avril.ui.loadingCover.removeAll(api.remove);
            avril.ui.loadingCover.hideAll(api.hide);
            $cover.appendTo('body');
            adjustCover();
            $(window).resize(function () {
                adjustCover();
            });
            if (handle.is('body')) {
                adjustAlwaysVisible();
            }
            handle.data('loadingCover', api);
        } else {
            handle.data('loadingCover').show();
        }
    }

    $.fn.loadingCover = function (option) {
        this.each(function () { loadingCover.call(this, option); });
        return this;
    }
    //cache the loading image
    $(function () {
        $('body').loadingCover();
        avril.ui.loadingCover.hideAll();
    });
})(jQuery);
//#endregion

avril.module.notify('avril.ui');
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
/// <reference path="../../scripts/_references.js" />

(function () {
    avril.namespace('avril.mvc.viewHelper');
    var viewHelper = avril.mvc.viewHelper, request = avril.mvc.request;

    //#region bindingHandlers

    ko.bindingHandlers.stopBinding = {
        init: function() {
            return { controlsDescendantBindings: true };
        }
    };

    /*oninit*/
    (function ko_inited() {
        var dataKey = 'ko-inited';
            ko.bindingHandlers.oninit = {
            init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                !$(element).data(dataKey) && valueAccessor() && $(element).ready(valueAccessor()(element, viewModel)) && $(element).data(dataKey, true);
            }
        };
    })();

    /*popup*/
    (function () {
        ko.bindingHandlers.pop = {
            init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                var $element = $(element);
                $element.click(function (e) {
                    e.preventDefault();
                    var options = ko.utils.unwrapObservable(valueAccessor()) || {};
                    viewHelper.pop(options.url || $element.attr('href'), $.extend({ title: '...' }, options));
                });
            }
        };
        ko.bindingHandlers.confirm = {
            init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                var $element = $(element);
                var options = ko.utils.unwrapObservable(valueAccessor()) || {};
                $element.unbind('click').click(function () {
                    avril.confirm(options.msg, options.func);
                });
            }
            , update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                var $element = $(element);
                var options = ko.utils.unwrapObservable(valueAccessor()) || {};
                $element.unbind('click').click(function () {
                    avril.confirm(options.msg, options.func);
                });
            }
        }
        ko.bindingHandlers.confirmPost = {
            init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                var $element = $(element);
                var options = ko.utils.unwrapObservable(valueAccessor()) || {};
                $element.unbind('click').click(function () {
                    avril.confirm(options.msg, function (r) {
                        r && $.post(options.url || $element.attr('href'), options.func);
                    });
                });
            }
            , update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                var $element = $(element);
                var options = ko.utils.unwrapObservable(valueAccessor()) || {};
                $element.unbind('click').click(function () {
                    avril.confirm(options.msg, function (r) {
                        r && $.post(options.url || $element.attr('href'), options.func);
                    });
                });
            }
        };
        ko.bindingHandlers.alert = {
            init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                var $element = $(element);
                var options = ko.utils.unwrapObservable(valueAccessor()) || {};
                $element.unbind('click').click(function () {
                    avril.confirm(options.msg, options.func);
                });
            }
            , update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                var $element = $(element);
                var options = ko.utils.unwrapObservable(valueAccessor()) || {};
                $element.unbind('click').click(function () {
                    avril.confirm(options.msg, options.func);
                });
            }
        }
    })();

    /*parital*/
    (function () {
        /*
        <div data-bind="partial:{view:'/viewPath',data:'/dataPath'}">
        </div>
        */
        ko.bindingHandlers.partial = {
            update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                var options = ko.utils.unwrapObservable(valueAccessor()) || {};
                if (typeof options === 'string') {
                    options = {
                        view: options
                    };
                }
                var _renderTemplate = function (resTmpl) {
                    ko.virtualElements.emptyNode(element);
                    if (options.data) {
                        if (typeof (options.data) === 'object') {
                            var innerBindingContext = bindingContext['createChildContext'](options.data, options['as']);
                            ko.renderTemplate(resTmpl.template || element, innerBindingContext, options, element);
                        } else if (typeof (options.data) === 'string') {
                            avril.mvc.request.getViewData(options.data, function (data) {
                                var innerBindingContext = bindingContext['createChildContext'](data, options['as']);
                                ko.renderTemplate(resTmpl.template || element, innerBindingContext, options, element);
                            });
                        }
                    } else {
                        ko.renderTemplate(resTmpl.template || element, bindingContext, options, element);
                    }
                };
                if (options.view) {
                    avril.mvc.request.getViewTemplate(options.view, _renderTemplate);
                } else {
                    _renderTemplate({});
                }
            }
        };
        ko.virtualElements.allowedBindings['partial'] = true;
    })();

    //#endregion

    //#region popup
    viewHelper.modal = {
        paramName: '_modal'
		, getModals: function (url) {
		    var self = this;
		    var req = avril.request(url);
		    return avril.object(req.queryString).keys()
			.where(function (key) {
			    return key.indexOf(self.paramName) == 0;
			}).select(function (key) {
			    return { key: key, url: unescape(req.param(key)) };
			});
		}
		, addToUrl: function (url, modalUrl) {
		    var currentModals = this.getModals(url);

		    var query = currentModals.where(function (modal) {
		        return modal.url == modalUrl;
		    });

		    if (query.length == 0) {
		        var req = avril.request(url);
		        req.param(this.paramName + currentModals.length, escape(modalUrl));
		        return req.getUrl();
		    }
		    return url;
		}
		, removeFromUrl: function (url, modalUrl) {
		    var req = avril.request(url);
		    this.getModals(url).where(function (modal) {
		        return modal.url == modalUrl;
		    }).each(function (modal) {
		        req.param(modal.key, null);
		    });

		    return req.getUrl();
		}
		, getPureUrl: function (url) {
		    var req = avril.request(url);
		    this.getModals(url).each(function (modal) {
		        req.param(modal.key, null);
		    });

		    return req.getUrl();
		}
    };

    var popCache = {};

    viewHelper.pop = function (url, popOptions) {
        if (!url) {
            return false;
        }
        if (popCache[url]) {
            popCache[url].show();
        } else {

            var pop = popCache[url] = avril.ui.pop($.extend(true, {
                needData: false
                , esc: true
            }, popOptions));

            var pools = $.extend(avril.mvc.models.getPool(), {
                rootPools: avril.mvc
                , pop: pop
            });

            pop.show.onShow(function () {
                var hash = avril.mvc.routes.getHash();
                var newHash = viewHelper.modal.addToUrl(hash, url);
                Backbone.history.navigate(newHash, false);
            });

            pop.hide.onHide(function () {
                popCache[url] = undefined;
                var hash = avril.mvc.routes.getHash();
                var newHash = viewHelper.modal.removeFromUrl(hash, url);
                Backbone.history.navigate(newHash, false);
            });

            pop.events.onContentReady(function () {
                var $configScript = pop.$pop().find('[type="text/config"]');
                if ($configScript.length) {
                    try {
                        var config = eval('(' + $configScript.text() + ')');
                        pop.options(config);
                    } catch (E) { }
                }
                if (pop.options().needData) {
                    request.getViewData(url || pop.options().dataUrl, function (res) {
                        pools.model('dialogModel')(res);
                    });
                }
                ko.applyBindings(pools, pop.$pop()[0]);
            });

            pop.show();

            request.getViewTemplate(url, function (err,res) {
                pop.options('content', $('#' + res.template).html());
            });
        }
    }

    viewHelper.pop.closeInactive = function (modals) {
        avril.object(popCache).keys().each(function (url) {
            if (popCache[url]) {
                var query = modals.where(function (modal) { return modal.url == url; });
                if (query.length == 0) {
                    popCache[url].hide();
                }
            }
        });
    }

    //init popup when hashchange
    avril.mvc.routes.onHashChange(function () {
        var hash = (Backbone.history.getHash() || '').replace('#', '');
        var modals = avril.mvc.viewHelper.modal.getModals(hash);
        modals.each(function (modal) {
            avril.mvc.viewHelper.pop(modal.url);
        });
        avril.mvc.viewHelper.pop.closeInactive(modals);
    });
    //#endregion

})();