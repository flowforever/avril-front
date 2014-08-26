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
            $( avril.mvvm.selector ).on(avril.Mvvm.defaults.trigger_events,function(){
                var $el = $(this)
                    , ns = mvvm.getNs($el);
                mvvm.setVal(ns, $el.val());
            });
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
                self.selector.split(',').ex().each(function(selector){
                    if( $el.is(selector)){
                        var binderName = selector.replace(/\[|\]/g,'').replace(avril.Mvvm.defaults.attr_pre+'-','');
                        binder[binderName] = bindlers[binderName];
                    }
                });
                $el.data('av-binders', binder);
                return binder;
            }
            ,  _rootScopes = {}
            , getWatchers = function(ns){

            }
            , __unWatcherExps = [
                'function'
                , 'var'
                , 'for'
                , 'if'
                , 'switch'
                , 'case'
            ]
            , _expressionReg = /(\$scope|\$data|\$root|\$parent)(\.\S+|\[\S+\])*/g
            , resolveExpressWatchers = function(){
                var cache = {};
                return function(expression){
                    if(cache[expression]){
                        return cache[expression];
                    }
                    var watchers = _expressionReg.exec(expression);
                    return cache[expression] = watchers.where(function(w){
                        return __unWatcherExps.indexOf(w) < 0;
                    });
                };
            }
            , binderName = function(binderName){
                return avril.Mvvm.defaults.attr_pre+'-'+binderName;
            }
            , resolveNs = function($el, ns){
            }
            , getScope = function(ns){
                var data = avril.object( _rootScopes).tryGetVal(ns) ;
                return $.extend(true, {} , {
                    $root: _rootScopes
                    , $data:data
                });

            }
            , evalExpression = function(expression, $el , binderName){
                var ns = self.getNs($el)
                    , watchers = resolveExpressWatchers(expression);

                ns = resolveNs(ns);

                var $scope = getScope(ns);

                with ($scope){

                    var $data = $scope.data;

                    var $av = function(expression,dependencies){
                        if(dependencies){
                            $.each(dependencies.split(','), function(watcher){
                               watchers.push(watcher);
                            });
                        }
                        if(typeof expression == 'function'){
                            return expression($el , binderName);
                        }
                        return expression || null;
                    };

                    if(expression && expression.indexOf('$av') < 0){
                        expression = '$av('+expression+')';
                    }

                    try
                    {
                        var value = eval( expression );

                        return value;

                    } catch (E){
                        if(avril.Mvvm.defaults.dev === true){
                            throw E;
                        }
                        if(avril.Mvvm.defaults.errorHandler){
                            avril.Mvvm.defaults.errorHandler(E);
                        }
                    }

                    return '';
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
                return avril.object(bindlers).keys().ex().select(function(key){
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
            , updateElement = function(){
                var $el = $(el);
                var binders = getBinders($el);
                for(var k in binders){
                    binders[k].update($el, valueAccessorFunc($el,k), self );
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

        this.updateDom = function($el){
            $($el).find(self.selector).each(function(){
                updateElement(this);
            });
        };

        this.evalExpression = evalExpression;

        this.setVal = function(ns, value) {
            avril.object(_rootScope).setVal(ns, value);
        };

        this.subscribe = function(ns, func){
            avril.event.get(ns,this)(func);
        };

        this.getBindingOptions = getBinders;

        this.getNs = function($el){
            var ns = ''
                , nsBinderName = binderName('ns');

            if($el.attr(nsBinderName )){
                ns = $el.attr(nsBinderName);
            }

            return ns;
        };

        this.getAbsNs = function($el){
            return resolveNs(this.getNs());
        }

        var addBinder = this.addBinder.bind(this);

        addBinder('ns', function($el,value,mvvm){
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

        addBinder('html', function($el, value,mvvm){
            bindlers.data.init.apply(bindlers.data, arguments);
        });

    });

    avril.Mvvm.defaults = {
        attr_pre: 'av'
        , trigger_events: 'change keyup'
    };

    avril.mvvm = avril.Mvvm();

})(jQuery, window);
