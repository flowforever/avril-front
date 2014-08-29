/**
 * Created by trump.wang on 2014/6/26.
 */
;(function($, win){
    var Mvvm = avril.createlib('avril.Mvvm', function(options){

        var config = $.extend(this.options(), options, {})
            , self = this
            , binders = {}
            , getBinders = function($el){
                var binder = $el.data('av-binders');
                if(binder){
                    return binder;
                }
                binder = {};
                self.selector.split(',').each(function(selector){
                    if( $el.is(selector)){
                        var binderName = selector.replace(/\[|\]/g,'').replace(Mvvm.defaults.attr_pre+'-','');
                        binder[binderName] = binders[binderName];
                    }
                });
                $el.data('av-binders', binder);
                return binder;
            }
            ,  _rootScopes = {}
            , _expressionReg = /(\$scope|\$data|\$root|\$parent)(\.\S+|\[\S+\])*/g
            , _simpleExpressionReg = /^\S+$/
            , resolveExpressWatchers = function(){
                var cache = {};
                return function(expression){
                    expression = expression.replace(/^\s+|\s+$/g,'');
                    if(cache[expression]){
                        return cache[expression];
                    }
                    var watchers = [] , watcher;
                    while(watcher = _expressionReg.exec(expression) ){
                        watchers.push(watcher[0]);
                    }

                    return cache[expression] = watchers;
                };
            }()
            , binderName = function(binderName){
                return Mvvm.defaults.attr_pre+'-'+binderName;
            }
            , getScope = function(ns){
                var data = avril.object( _rootScopes).tryGetVal(ns);
                return $.extend(true, {} , {
                    $root: _rootScopes
                    , $data: data || ''
                    , $scope: data || {}
                });
            }
            , evalExpression = function(expression, $el){
                if(_simpleExpressionReg.test(expression) && !/^\d+/.test(expression)){
                    expression = '$scope.'+expression ;
                }

                //todo remove this change _simpleExpressionReg
                expression = expression.replace('$scope.$root','$scope');

                var ns = self.getNs($el)
                    , watchers = resolveExpressWatchers(expression);

                watchers.each(function(watchPath){
                    var absNs = resolveAbsNs(ns, watchPath);
                    self.subscribe(absNs, function(newValue,oldValue,$sourceElement){
                        if(!Mvvm.elementExists($el)){
                            return 'removeThis';
                        }
                        if($sourceElement[0] != $el[0]){
                            if(watchers.length == 1){
                                updateElement($el , newValue );
                            } else {
                                updateElement($el, Mvvm.evalExpression(expression,getScope(ns)));
                            }
                        }
                    });
                });

                Mvvm.devInfo($el,'dependency',watchers.join(','));

                return Mvvm.evalExpression(expression,getScope(ns));
            }
            , valueAccessorFunc = function($el,k){

                var func = function(){
                    return evalExpression( $el.attr(binderName(k)) , $el , k );
                };

                func.expression = $el.attr(binderName(k));

                return func;
            }
            , selector = function(){
                return avril.object(binders).keys().select(function(key){
                    return '['+Mvvm.defaults.attr_pre+'-'+key+']'
                }).join(',');
            }
            , initElement = function(el){
                var $el = $(el);
                if($el.data('av-inited')){
                    return true;
                }
                $el.data('av-inited', true);
                var binders = getBinders($el);
                for(var k in binders){
                    binders[k].init($el, valueAccessorFunc($el,k), self );
                }
            }
            , updateElement = function(el, newValue){
                var $el = $(el);
                var binders = getBinders($el);
                for(var k in binders){
                    binders[k].update($el, function(){ return newValue; }, self );
                }
            }
            , bindGlobal = function(){
                var binded = false;
                return function(){
                    if(binded ){
                        return true;
                    }
                    binded = true;
                    var attrPre = Mvvm.defaults.attr_pre;
                    var mvvm = avril.mvvm;
                    $(avril.mvvm.selector).on(Mvvm.defaults.trigger_events,function(){
                        var $el = $(this);
                        if($el.is(mvvm.selector) && $el.is('input,textarea,select')){
                            var ns = mvvm.getNs($el)
                                , absPath = mvvm.getAbsNs($el);
                            mvvm.setVal(absPath, $el.val(), $el);
                        }
                    });
                    $('html').attr(attrPre+'-scope','$root');
                }
            }();

        this.selector = selector();

        this.addBinder = function(name,binder){
            if(typeof binder == 'function'){
                binder = {
                    init:binder
                }
            }
            if(!binder.update){
                binder.update = binder.init;
            }
            binders[name] = {
                init: function($el){
                    binder && binder.init && binder.init.apply(binder, arguments);
                }
                , update: function(){
                    binder && binder.update && binder.update.apply(binder, arguments);
                }
            };
            this.selector = selector();
        };

        this.bindDom = function($el){
            bindGlobal();
            $el = $el? $($el) : $(document);
            $el.find(self.selector).each(function(){
                initElement(this);
            });
        };

        this.evalExpression = evalExpression;

        var getEvent = function(ns){
            return avril.event.get(ns,self);
        }

        this.setVal = function(ns, value , $sourceElement) {
            var oldValue = avril.object(_rootScopes).tryGetVal(ns);
            if(oldValue!=value){
                if(value){
                    if(!isNaN(value)){
                        value = Number(value);
                    }
                }
                avril.object(_rootScopes).setVal(ns, value);
                getEvent(ns)([ value, oldValue, $sourceElement ]);
            }
        };

        this.subscribe = function(ns, func){

            getEvent(ns)(func);
        };

        this.getBinders = getBinders;

        this.getNs = function($el){
            var ns = ''
                , nsBinderName = Mvvm.bindingName('scope')
                , $parents = $el.parents();

            if($el.attr(nsBinderName )){
                ns = $el.attr(nsBinderName);
            }

            if(ns.indexOf('$root') >= 0){
                return ns;
            }

            $parents.each(function(){
                var $parent = $(this);
                if($parent.attr(nsBinderName)){
                    ns = $parent.attr(nsBinderName) +'.' + ns;
                }
                if(ns.indexOf('$root') >= 0){
                    return false;
                }
            });

            ns = ns.replace(/\.$/g,'');

            Mvvm.devInfo($el,'scope',ns);

            return ns;
        };

        var resolveAbsNs = function(ns, relativeNs){
            if(relativeNs.indexOf('$root') == 0){
                return relativeNs;
            }
            relativeNs = relativeNs.replace('$scope.','');
            if(relativeNs.indexOf('$parent') < 0){
                return ns +'.' + relativeNs;
            }
            var nsPaths = ns.split('.');
            while(relativeNs.indexOf('$parent') == 0){
                nsPaths.pop();
                relativeNs = relativeNs.replace('$parent.','');
            }
            return nsPaths.join('.')+'.'+relativeNs;
        }
        this.getAbsNs = function($el){
            var ns = this.getNs($el);
            var relativeNs = $el.attr(binderName('data')) || $el.attr(binderName('html'));
            return resolveAbsNs(ns,relativeNs);
        }

        var addBinder = this.addBinder.bind(this);

        addBinder('stop', function($el,value){
            var val = value();
        });

        addBinder('scope', function($el,value){
            var ns = '$root';
        });

        addBinder('data',function($el,value){
            var val = value();
            if($el.is('input')){
                if($el.is(':checkbox') || $el.is(':radio')){
                    $el.attr('checked' , $el.val() === val );
                }else{
                    $el.val(val);
                }
            } else if($el.is('textarea') || $el.is('select')){
                $el.val( val );
            } else {
                $el.attr(binderName('html')) ? $el.html(val) : $el.text( val );
            }
        });

        addBinder('exec', function($el,value){
            value();
        });

        addBinder('execScript', function($el,value){
            var expression = $el.html();
        });

        addBinder('html', function($el, value){
            binders.data.init.apply(binders.data, arguments);
        });

        addBinder('each', {
            init: function($el,value){
                avril.data($el, $el.html());
                this.update($el,value);
            }
            ,update: function($el,value){
                var html = avril.data($el);

            }
        });

        addBinder('if',{
            init:function($el,value){
                avril.data($el, $el.html());
            }
            , update: function($el,value){

            }
        })

    });

    Mvvm.defaults = {
        attr_pre: 'av'
        , trigger_events: 'change keyup'
        , show_dev_info : true
    };

    Mvvm.bindingName = function(name){
        return this.defaults.attr_pre+'-'+name;
    };

    Mvvm.devInfo = function ($el, name,info) {
        this.defaults.show_dev_info && $el.attr( this.bindingName(name)+'-dev', info );
    };

    Mvvm.elementExists = function($el){
        return $el.parents('html').length > 0 || $el.is('html');
    };

    var evalExpression = function(expression, $scope){
        with ($scope){
            try
            {
                return eval( expression );
            } catch (E){
                if(avril.Mvvm.defaults.dev === true){
                    throw E;
                }
                if(avril.Mvvm.defaults.errorHandler){
                    avril.Mvvm.defaults.errorHandler(E);
                }
            }
        }

        return '';
    };

    Mvvm.evalExpression = evalExpression;

    avril.mvvm = avril.Mvvm();
})(jQuery, window);
