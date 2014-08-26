/**
 * Created by trump.wang on 2014/6/26.
 */
;(function($, win){
    var innerHelper = {

    };

    var bindGlobal = function(){
        var binded = false;
        return function(){
            if(binded ){
                return true;
            }
            binded = true;
            var attrPre = avril.Mvvm.defaults.attr_pre;
            var mvvm = avril.mvvm;
            $(avril.mvvm.selector).on(avril.Mvvm.defaults.trigger_events,function(){
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

    avril.createlib('avril.Mvvm', function(options){

        var config = $.extend(this.options(), options, {})
            , self = this
            , bindlers = {}
            , getBinders = function($el){
                var binder = $el.data('av-binders');
                if(binder){
                    return binder;
                }
                binder = {};
                self.selector.split(',').each(function(selector){
                    if( $el.is(selector)){
                        var binderName = selector.replace(/\[|\]/g,'').replace(avril.Mvvm.defaults.attr_pre+'-','');
                        binder[binderName] = bindlers[binderName];
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
                return avril.Mvvm.defaults.attr_pre+'-'+binderName;
            }
            , getScope = function(ns){
                var data = avril.object( _rootScopes).tryGetVal(ns) ;
                return $.extend(true, {} , {
                    $root: _rootScopes
                    , $data:data
                });

            }
            , evalExpression = function(expression, $el , binderName){
                if(_simpleExpressionReg.test(expression) && !/^\d+/.test(expression)){
                    expression = '$scope.'+expression ;
                }

                //todo remove this change _simpleExpressionReg
                expression = expression.replace('$scope.$root','$scope');

                var ns = self.getNs($el)
                    , watchers = resolveExpressWatchers(expression);

                var $scope = getScope(ns);

                with ($scope){

                    var $data = $scope.data , evalValue;

                    var $av = function(expression,dependencies){
                        if(dependencies){
                            $.each(dependencies.split(','), function(watcher){
                               watchers.push(watcher);
                            });
                        }
                        if(typeof expression == 'function'){
                            return expression($el);
                        }
                        return expression || '';
                    };

                    if(expression && expression.indexOf('$av') < 0){
                        expression = '$av('+expression+')';
                    }
                    
                    try
                    {
                        evalValue = eval( expression );
                        return value;
                    } catch (E){
                        if(avril.Mvvm.defaults.dev === true){
                            throw E;
                        }
                        if(avril.Mvvm.defaults.errorHandler){
                            avril.Mvvm.defaults.errorHandler(E);
                        }
                        avril.Mvvm.defaults.show_full_ns && (function(){
                            $el.attr('av-error-dev', E.message);
                        })();
                    }

                    watchers.each(function(w){
                        var absNs = resolveAbsNs(ns, w);
                        self.subscribe(absNs, function(newValue,oldValue,$sourceElement){
                            if($el.length==0){
                                return 'removeThis';
                            }
                            if($sourceElement[0] != $el[0]){
                                updateElement($el , newValue );
                            }
                        });
                    });

                    return evalValue || '';
                }
            }
            , valueAccessorFunc = function($el,k){

                var func = function(){
                    return evalExpression( $el.attr(binderName(k)) , $el , k );
                };

                func.expression = $el.attr(binderName(k));

                return func;
            }
            , selector = function(){
                return avril.object(bindlers).keys().select(function(key){
                    return '['+avril.Mvvm.defaults.attr_pre+'-'+key+']'
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
            ;

        this.init = function(){
            return this;
        };

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
            bindlers[name] = {
                init: function(){
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
                avril.object(_rootScopes).setVal(ns, value);
                getEvent(ns)([ value, oldValue, $sourceElement ]);
            }
        };

        this.subscribe = function(ns, func){
            getEvent(ns)(func);
        };

        this.getBindingOptions = getBinders;

        this.getNs = function($el){
            var ns = ''
                , nsBinderName = binderName('scope')
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


            avril.Mvvm.defaults.show_full_ns && $el.attr(nsBinderName+'-dev',ns);

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

        addBinder('stop', function($el,value,mvvm){
            var val = value();
        });

        addBinder('scope', function($el,value,mvvm){
            var ns = '$root';
        });

        addBinder('data',function($el,value,mvvm){
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

        addBinder('exec', function($el,value,mvvm){
            value();
        });

        addBinder('execScript', function($el,value,mvvm){
            var expression = $el.html();
        });

        addBinder('html', function($el, value,mvvm){
            bindlers.data.init.apply(bindlers.data, arguments);
        });

    });

    avril.Mvvm.defaults = {
        attr_pre: 'av'
        , trigger_events: 'change keyup'
        , show_full_ns : true
    };

    avril.mvvm = avril.Mvvm();

})(jQuery, window);
