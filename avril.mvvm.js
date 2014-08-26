/**
 * Created by trump.wang on 2014/6/26.
 */
;(function($, win){
    var innerHelper = {

    };

    avril.createlibOn(innerHelper,'OneTimeEvent',function(){
        this._inited = false;
        this.init = function(func){
            this.func = func;
            return this;
        }
        this.exec = function(){
            !this._inited && this.func && this.func();
        }
    });

    innerHelper.globalEventBind = innerHelper.OneTimeEvent().init(function(){
        var attrPre = avril.Mvvm.defaults.attr_pre;
        $('[^'+attrPre+'-]').live(avril.Mvvm.defaults.trigger_events,function(){

            var $el = this
                , ns = mvvm.getNs($el);
            mvvm.setVal(ns, $el.val());
        });
    });

    avril.createlib('avril.Mvvm', function(options){

        var config = $.extend(this.options(), options, {})
            , self = this
            , bindlers = {}
            , getBinders = function($el){

            }
            ,  _rootScopes = {}
            , getWatchers = function(ns){

            }
            , binderName = function(binderName){
                return avril.Mvvm.defaults.attr_pre+'-'+binderName;
            }
            , resolveNs = function($el, ns){

            }
            , computePattern = {
                '$av( expression, watch )': function() { }
            }
            , getScope = function(ns){
                var scope = avril.object( _rootScopes).tryGetVal(ns) || {};

                $.extend({
                    $mvvm: self
                    , $root: _rootScopes
                }, scope);

            }
            , evalExpression = function(expression, $el , binderName){
                var ns = self.getNs($el);
                ns = resolveNs(ns);

                with (getScope(ns)){
                    var $av = function(expression,dependencies){
                        if(typeof expression == 'function'){
                            return expression($el , binderName);
                        }
                        return expression || null;
                    };

                    if(expression && expression.indexOf('$av') < 0){
                        expression = '$av('+expression+')';
                    }

                    var value = eval( expression );

                    return value;
                }
            }
            ;

        this.init = function(){
            return this;
        };

        this.addBinder = function(name,binderFunc){
            bindlers[name] = binderFunc;
        };

        this.bindDom = function(){
            innerHelper.globalEventBind.exec();
        };

        this.updateDom = function(){}

        this.setVal = function(ns, value) {
            avril.object(_rootScope).setVal(ns, value);
        };

        this.subscribe = function(ns, func){
            avril.event.get(ns,this)(func);
        };

        this.getBindingOptions = function($el){

        }

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

        var addBinder = this.addBinder.bind(this)
            , getBindingOptions = this.getBindingOptions.bind(this);

        addBinder('ns', function(mvvm, onInit, onChange){

            onInit(function($el, binderVal){

            });

            onChange(function($el, binderVal){

            });
        });

        addBinder('stop', function(mvvm, onInit, onChange){

            onInit(function($el, binderVal){

            });

            onChange(function($el, binderVal){

            });
        });

        addBinder('html', function(mvvm, onInit, onChange){

            onInit(function($el, binderVal){

            });

            onChange(function($el, binderVal){

            });
        });

        addBinder('data', function(mvvm, onInit, onChange){

            onInit(function($el, binderVal){

            });

            onChange(function($el, binderVal){

            });
        });

        addBinder('html', function(mvvm, onInit, onChange){

            onInit(function($el, binderVal){

            });

            onChange(function($el, binderVal){

            });
        });

        addBinder('if', function(mvvm, onInit, onChange){

            onInit(function($el, binderVal){

            });

            onChange(function($el, binderVal){

            });
        });

        addBinder('each', function(mvvm, onInit, onChange){

            onInit(function($el, binderVal){

            });

            onChange(function($el, binderVal){

            });
        });

        addBinder('css', function(mvvm, onInit, onChange){

            onInit(function($el, binderVal){

            });

            onChange(function($el, binderVal){

            });
        });

        addBinder('attrs', function(mvvm, onInit, onChange){

            onInit(function($el, binderVal){

            });

            onChange(function($el, binderVal){

            });
        });

        addBinder('styles', function(mvvm, onInit, onChange){

            onInit(function($el, binderVal){

            });

            onChange(function($el, binderVal){

            });
        });

        addBinder('template', function(mvvm, onInit, onChange){

            onInit(function($el, binderVal){

            });

            onChange(function($el, binderVal){

            });
        });

    });

    avril.Mvvm.defaults = {
        attr_pre: 'av'
        , trigger_events: 'change keyup'
    };

    avril.mvvm = avril.Mvvm();

})(jQuery, window);
