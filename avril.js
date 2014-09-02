//#region avril.array
;(function(){

    String.prototype.toUnicode = function () {
        return escape(this).replace(/\%/g, '\\');
    }

    String.prototype.endWidth = function (str, ignoreCase) {
        if (ignoreCase) {
            var source = this.toLower();
            var target = str.toLower();
            return source.indexOf(target, source.length - target.length) !== -1;
        }
        return this.indexOf(str, this.length - str.length) !== -1;
    }

    String.prototype.beginWidth = function (str, ignoreCase) {
        if (ignoreCase) {
            var source = this.toLower();
            var target = str.toLower();
            return source.indexOf(target) == 0;
        }
        return this.indexOf(str) == 0;
    }

    String.prototype.replaceAll = function (word, replacement) {
        var reg = new RegExp(word, 'gi');
        return this.replace(reg, replacement);
    }

    String.prototype.equals = function (target, ignoreCase) {
        if (ignoreCase == undefined) { ignoreCase = true; }
        if (target != undefined && target != null) {
            return this == target || this.toLower() == target.toLower();
        }
        return this == target;
    }

    String.prototype.trim = function () {
        var reg = /(^\s*)|(\s*$)/g;
        return this.replace(reg, "");
    }

    String.prototype.trimAll = function () {
        var reg = /\s*/g;
        return this.replace(reg, '');
    }

    String.prototype.uperChar0 = function () {
        var name = this;
        var char0 = name.charAt(0);
        var r = char0.toUpperCase();
        return name.replace(new RegExp('^' + char0), r);
    }

    String.prototype.lowerChar0 = function () {
        var name = this;
        var char0 = name.charAt(0);
        var r = char0.toLowerCase();
        return name.replace(new RegExp('^' + char0), r);
    }

    String.prototype.toLower = String.prototype.toLowerCase;

    String.prototype.toUpper = String.prototype.toUpperCase;

    String.prototype.ellipsis = function (length, ellipsisLength) {
        var str = this.toString();
        if (str.length <= length)
            return str;

        ellipsisLength = ellipsisLength || 3;
        var ret = str.substr(0, length - ellipsisLength);
        for (var i = 0; i < ellipsisLength; i++) {
            ret = ret + ".";
        }
        return ret;
    }

    function isLambda(str) {
        return str && typeof (str) == 'string' && str.indexOf('=>') > 0;
    }

    String.prototype.lambda = function (ctx) {
        var str = this;
        if (isLambda(str)) {
            var lambdaKey = str.indexOf('=>')
                , args = str.substring(0, lambdaKey)
                , funcContent = str.substring(lambdaKey + 2)
                , funcStr = 'function';
            if (args.indexOf('(') < 0) {
                funcStr += ' (' + args + ')';
            } else {
                funcStr += args;
            }

            if (funcContent.indexOf('{') >= 0) {
                if (funcContent.indexOf(';') >= 0) {
                    funcStr += funcContent;
                } else {
                    funcStr += '{ return ' + funcContent + '; }';
                }
            } else {
                funcStr += '{ return ' + funcContent + '; }'
            }

            if (ctx) {
                with (ctx) {
                    return eval('(' + funcStr + ')');
                }
            }

            return eval('(' + funcStr + ')');

            /*
             {
             return o.b;
             }

             o.b

             { a:o.b }

             {

             }
             */
        }
    }

    function arrayEx(org) {

        var instance = {};

        function isFunc(func) {
            return typeof func == 'function';
        }

        function parseFuncLambda(func) {
            return isFunc(func) ?
                func :
                (isLambda(func) ? func.lambda() : function () {

                });
        }

        function sort(instance, field, dirc) {
            dirc = dirc || 1;
            return instance.sort(function (x, y) {
                if (field) {
                    if (x[field] > y[field]) {
                        return dirc;
                    } else {
                        return -1 * dirc;
                    }
                } else {
                    if (x > y) {
                        return dirc;
                    } else {
                        return -1 * dirc;
                    }
                }
            });
        }

        instance.asc = function (field) {
            return sort(this, field, 1);
        }

        instance.desc = function (field) {
            return sort(this, field, -1);
        }

        instance.each = function (func) {
            func = parseFuncLambda(func);
            for (var i = 0; i < this.length; i++) {
                if (func(this[i], i) == false) {
                    break;
                }
            }
            return this;
        }

        instance.where = function (func) {
            func = parseFuncLambda(func);
            var results = [];
            this.each(function (value, index) {
                if (func(value, index) == true) {
                    results.push(value);
                }
            });
            return results;
        }

        instance.first = function (func) {
            func = parseFuncLambda(func);
            if (this.length == 0) {
                return null;
            }
            if (func) {
                return this.where(func)[0];
            } else {
                return this[0];
            }
        }

        instance.last = function (func) {
            func = parseFuncLambda(func);
            if (this.length == 0) {
                return null;
            }
            if (isFunc(func)) {
                return this.where(func).last();
            } else {
                return this[this.length - 1];
            }
        }

        instance.groupBy = function (func) {
            func = parseFuncLambda(func);
            if (func) {
                var obj = {};
                this.each(function (item, index) {
                    var key = func(item, index) + '';
                    if (!obj[key]) {
                        obj[key] = [];
                    }
                    obj[key].push(item);
                });
                return obj;
            }
            return this;
        }

        instance.take = function (num) {
            var result = [];
            for (var i = 0; i < num; i++) {
                result.push(this[i]);
            }
            return result;
        }

        instance.skip = function (num) {
            var result = [];
            for (var i = num; i < this.length; i++) {
                result.push(this[i]);
            }
            return result;
        }

        instance.select = function (func) {
            func = parseFuncLambda(func);
            var results = [];
            this.each(function (value, index) {
                results.push(func.call(value, value, index));
            });
            return results;
        }

        instance.remove = function (func) {
            func = parseFuncLambda(func);
            var toRemove = [];
            this.each(function (val, index) {
                if (func(val, index)) { toRemove.push(index); }
            });
            var arr = this;
            toRemove.reverse().each(function (val) { arr.splice(val, 1) });
            return arr;
        }

        instance.removeElement = function (elment) {
            return this.remove(function (value, index) { return value == elment; });
        }

        instance.removeAt = function (index) {
            return this.remove(function (value, index) { return index == index; });
        }

        instance.indexOf = function (element) {
            var i = -1;
            this.each(function (value, index) {
                if (value == element) {
                    i = index;
                    return false;
                }
            });

            return i;
        }

        instance.contain = function (element, elementIsFunction) {
            if (true != elementIsFunction && typeof element == 'function') {
                return this.where(element).length > 0;
            }
            return this.indexOf(element) >= 0;
        }

        var isFunc = function (obj) {
            return typeof obj == 'function';
        }

        instance.distinc = function (compareFunc) {
            var arr = [];
            this.each(function (value, index) {
                if (isFunc(compareFunc)
                    && compareFunc(value, index) != false) {
                    arr.push(value);
                } else if (!isFunc(compareFunc)
                    && !arr.contain(value)) {
                    arr.push(value);
                }
            });
            return arr;
        }

        instance.clone = function () {
            var arr = [];
            for (var i = 0; i < this.length; i++) {
                arr.push(this[i]);
            }
            return arr;
        }

        for (var k in instance) {
            org[k] = org[k] || instance[k];
        }

        return org;
    }

    arrayEx(Array.prototype);

    if (!Function.prototype.bind) {
        Function.prototype.bind = function (oThis) {
            if (typeof this !== "function") {
                // closest thing possible to the ECMAScript 5 internal IsCallable function
                throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
            }

            var aArgs = Array.prototype.slice.call(arguments, 1),
                fToBind = this,
                fNOP = function () {},
                fBound = function () {
                    return fToBind.apply(this instanceof fNOP && oThis
                            ? this
                            : oThis,
                        aArgs.concat(Array.prototype.slice.call(arguments)));
                };

            fNOP.prototype = this.prototype;
            fBound.prototype = new fNOP();

            return fBound;
        };
    }

})();
//#endregion
; (function (window) {
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
                if(!obj){
                    return [];
                }
                if(obj instanceof  Array){
                    return obj;
                }
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
            return  Math.random().toString().replace('.', '_') + '_' +  (new Date().getTime());
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

        var __getHash = (function(){
            var counter = 0;
            return function (obj) {
                if(obj === null){
                    return 'null';
                }

                if(typeof obj === 'string'){
                    return obj;
                }

                var objType = typeof obj;
                if(objType !== 'object'){
                    return objType;
                }

                return obj['___hash___'] || (obj['___hash___'] = avril.guid()+'__'+(counter++));
            }
        })();

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
            add: function (func, name, data, ctx) {
                name = name || "default";
                if (!this.eventList[name]) {
                    this.eventList[name] = [];
                }
                var eve = {
                    func: func,
                    data: data,
                    ctx: ctx
                };
                this.eventList[name].push(eve);
            },
            execute: function (name, context, data) {
                var self = this;

                name = name || 'default';

                this.eventList[name] = this.eventList[name] || [];

                context = context || avril.event._event;

                var result = true;

                var toRemove = [];

                this.eventList[name].each(function (fnObj) {
                    var execResult , ctx = fnObj.ctx || context;
                    if (data && data.length >= 0) {
                        var args = [];
                        for (var i = 0; i < data.length; i++) {
                            args.push(data[i]);
                        }
                        if (fnObj.data) {
                            args.push(fnObj.data);
                        }
                        result = result && (!( (execResult = fnObj.func.apply(ctx, args)) == false));
                    } else {
                        result = result && (!( (execResult = fnObj.func.call(ctx, data, fnObj.data) ) == false));
                    }
                    if(execResult === 'removeThis'){
                        toRemove.push(fnObj);
                    }
                });

                toRemove.each(function(fnObj){
                    self.eventList[name].removeElement(fnObj);
                });

                return result;
            },
            clear: function (name) {
                this.eventList[name] = [];
            }
        };

        event.events = event._event.eventList;

        event.register = function (fnName, registerCtx) {
            if (event._event[fnName]) {
                return event._event[fnName]
            }
            var func = function (func, data, ctx) {
                if (typeof (func) == 'function') {
                    avril.event._event.add(func, fnName, data, ctx || registerCtx);
                } else { //func is a param when ajax-submit execute
                    data = data || func;
                    registerCtx = registerCtx || data;
                    return avril.event._event.execute(fnName, registerCtx, data);
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

            var fnName = namespace.replace(new RegExp('\\.', 'gi'), '_');

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

    avril.execTime = function(func,name){
        var t0 = new Date().getTime();
        func && func();
        var t1 = new Date().getTime() - t0;
        avril.execTime.funcTimes.push(t1);
        name && (avril.execTime.funcTimeMap[name] = t1);
        return t1;
    };
    avril.execTime.funcTimes = [];
    avril.execTime.funcTimeMap = {};

    //
    if (!window.console) {
        window.console = {};
        window.console.log = function () { };
    }

    'log,warn,error'.split(',').each(function(action){
        avril[action] = function(msg){
            console[action] && console[action](msg);
        }
    })
})(this);
