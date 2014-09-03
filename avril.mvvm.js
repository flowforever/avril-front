/**
 * Created by trump.wang on 2014/6/26.
 */
;(function($, _evalExpression){
    var Mvvm = avril.createlib('avril.Mvvm', function(options){

        var config = $.extend(this.options(), options, {
                guid: avril.guid()
            })
            , self = this
            , binders = {}
            , expressionParsers = []
            , magics = {}
            , getBinders = function($el){
                var binder = $el.data('avBinders');
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
                $el.data('avBinders', binder);
                return binder;
            }
            ,  _rootScopes = {
                $root:{}
                , $controllers: {}
            }
            , _expressionReg = /\$(data|scope|root|parent)(\[\".+?\"\]|\[\'.+?\'\]|\[\d+\]|\.(\w+\d*)+)+/g
            , getSimpleReg = function(){ return /^((\[(\d+|\".+?\"|\'.+?\')\]|\w+\d*)+(\.\w+\d*)*)+$/g; }
            , findExpressionDependency = function(){
                var cache = {};
                return function(expression, onFind){
                    expression = expression.replace(/^\s+|\s+$/g,'');
                    if(cache[expression]){
                        return onFind? cache[expression].each(onFind) : cache[expression];
                    }
                    var watchers = [] , watcher;
                    while(watcher = _expressionReg.exec(expression) ){
                        watchers.push(watcher[0]);
                        onFind && onFind(watcher[0]);
                    }
                    return cache[expression] = watchers;
                };
            }()
            , binderName = Mvvm.bindingName.bind(Mvvm)
            , binderDataName = function(bName){
                return binderName(bName) + '-data';
            }
            , getScope = function(ns, $el){
                var scope = avril.object( _rootScopes ).tryGetVal(ns) || {};
                return $.extend(true, {} , scope , magics, {
                    $root: _rootScopes.$root
                    , $scope: scope
                    , $ns: ns
                    , $el: $el
                });
            }
            , initDependency = function(expression, $el, binder , ns , oldNs , removeOldSubscribe){
                var parsedExpressionStr = parseExpression(expression);
                var counter = 0;
                var subscribeDependency = function(absNs, dependenPath){
                    self.subscribe(absNs, function(newValue,oldValue,options){
                        if(!Mvvm.elementExists($el)){
                            return 'removeThis';
                        }
                        if(dependenPath || (newValue != oldValue)){
                            updateElement($el, $.extend( options , { dependencies: dependenPath , oldValue: oldValue, newValue: newValue } ), binder);
                        }
                    }, {
                        binder: binder
                        , $el: $el
                        , ns: ns
                    });
                    Mvvm.devInfo($el, 'watch-'+binder+'-'+(counter++) , absNs );
                };
                subscribeDependency(ns);
                var watchers = findExpressionDependency(parsedExpressionStr,function(watchPath){
                    if(watchPath){
                        var absNs = resolveAbsNs(binder !== 'scope'? ns : self.getNs($el.parent()) , watchPath);
                        subscribeDependency(absNs, watchPath);
                        if(oldNs){
                            removeOldSubscribe( resolveAbsNs(oldNs, watchPath) , $el , oldNs );
                        }

                    }
                });
                return watchers;
            }
            , parseExpression = function(expression){
                expression = expression.replace(/^\s+|\s+$/g,'');

                expressionParsers.each(function(parser){
                    expression = parser(expression);
                });

                return expression;
            }
            , executeExpression = function(expression, $el){
                expression = parseExpression(expression,$el);
                var ns = self.getNs($el);
                var ctx = getScope(ns);
                return Mvvm.executeExpression(expression,ctx);
            }
            , valueAccessor = function($el,expression){
                return function(){
                    return executeExpression( expression , $el );
                };
            }
            , selector = function(){
                return avril.object(binders).keys().select(function(key){
                    return '['+Mvvm.defaults.attr_pre+'-'+key+']'
                }).join(',');
            }
            , binderSelector = function(name){
                return '['+binderName(name)+']'
            }
            , initElement = function(el , force ) {
                var $el = $(el);
                if(!Mvvm.elementExists($el)){
                    return true;
                }
                var stopAttrSelector = '['+binderName('stop')+']';
                if($el.is(stopAttrSelector) || $el.parents(stopAttrSelector).length){
                    return true;
                }
                if($el.data('av-inited') && !force){
                    return true;
                }
                $el.data('av-inited', true);
                initElementBinderDependency($el);
            }
            , initElementBinderDependency = function(){
                var nsCache = {}
                    , getOldNs = function($el){
                        return nsCache[ avril.getHash($el) ];
                    }
                    , cacheNs = function($el, ns){
                        nsCache[$el] = ns;
                    }
                    , removeOldSubscribe = function(subscribeChanel, $el, oldNs){
                        getEventChannel(subscribeChanel).remove(function(eventObj){
                            if(eventObj && eventObj.data && eventObj.data.$el && eventObj.data.ns){
                                return eventObj.data.$el.is($el) && eventObj.data.ns == oldNs;
                            }
                            return false;
                        });
                    };
                return function($el){
                    var binders = getBinders($el);
                    var ns = self.getNs($el);
                    for(var bName in binders){
                        var expression = $el.attr(binderName(bName));
                        var dependencies = initDependency(expression , $el , bName ,ns , getOldNs($el), removeOldSubscribe);
                        binders[bName].init($el, valueAccessor($el,expression),{
                            expression: expression
                            , ns: ns
                            , dependencies: dependencies
                        });
                    }
                    cacheNs($el, ns);
                }
            }()
            , updateElement = function(el, updateOptions, binder){
                var $el = $(el);
                var binders = getBinders($el);
                var expression = $el.attr(binderName(binder));
                binders[binder].update($el, valueAccessor($el,expression), $.extend(true,{},updateOptions,{
                    expression: expression
                    , binder: binder
                    , ns: self.getNs($el)
                }));
            }
            , _isExpressionTextNodeReg = /\{\{.+?\}\}/g
            , initTextNode = function($el, onFind){
                var arr = [];
                $el.find('*').each(function(){
                    for(var i= 0; i<this.childNodes.length;i++){
                        var n = this.childNodes[i];
                        if( n.nodeType === 3
                            && n.nodeValue
                            && !n.inited
                            && _isExpressionTextNodeReg.test(n.nodeValue)
                            ) {
                            arr.push( this.childNodes[i] );
                            onFind(this.childNodes[i]);
                        }
                    }
                }) ;
                return arr;
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
                    $(document).on(Mvvm.defaults.trigger_events, mvvm.selector ,function(){
                        var $el = $(this);
                        if($el.is(mvvm.selector) && $el.is('input,textarea,select')){
                            var absPath = mvvm.getAbsNs($el);
                            mvvm.setVal(absPath, $el.val(), $el);
                        }
                    });
                    $('html').attr(attrPre+'-scope','$root');
                }
            }()
            ;

        this.selector = selector();

        this.addBinder = function(name,binder){
            if(typeof binder == 'function'){
                binder = {
                    init:binder
                    , update:binder
                }
            }
            if(!binder.update){
                binder.update = function(){};
            }
            if(!binder.init){
                binder.init = function(){};
            }
            binders[name] = {
                init: binder.init.bind(binder)
                , update: binder.update.bind(binder)
            };
            this.selector = selector();
        };

        this.addExpressionParser = function(parser){
            expressionParsers.push(parser);
        };

        this.addMagic = function(name, func) {
            magics[name] = func;
        };

        this.bindDom = function(el){
            bindGlobal();

            var $el = !el || el === document?  $('html') : $(el);

            !$el.is('html') && initElement($el);

            $el.find(self.selector).each(function(i){
                avril.execTime(function(){
                    initElement(this);
                }.bind(this));
            });

            return false;
            if( !$el.is('html')){
                var max = Math.max.apply(null,avril.execTime.funcTimes);
                var maxIndex = avril.execTime.funcTimes.indexOf(max);
                console.log(avril.execTime.funcTimes.join(','));
                console.log(max);
                console.log(maxIndex);
                console.log($el.find(self.selector)[maxIndex]);
            }
        };

        var getEventChannel = function(subscribePath){
                return avril.event.get(subscribePath,self);
            }
            , optEvent = function(ns,opt){ return ns + '.$' + config.guid + '$' + opt; };

        this.setVal = function(ns, value , $sourceElement, silent) {
            var oldValue = avril.object(_rootScopes).tryGetVal(ns);
            if(oldValue != value){
                if(value){
                    if(!isNaN(value)){
                        value = Number(value);
                    }
                }
                avril.object(_rootScopes.$root).setVal(ns.replace(/^\$root\.?/,''), value);
                !silent && getEventChannel(ns)([ value, oldValue, { sourceElement: $sourceElement, channel: ns } ]);
            }
        };

        this.getVal = function(ns){
            return avril.object(_rootScopes).tryGetVal(ns);
        };

        this.subscribe = function(ns, func,options){
            var nsArr = ns.split(',');
            nsArr.each(function(scope){
                var ctx = {
                    subscribes:nsArr
                    , subscribeStr: ns
                    , current: scope
                    , values: function(func){
                        var values = this.subscribes.select(function(ns){
                            return self.getVal(ns);
                        });
                        func && func.apply(this, values);
                        return values
                    }
                };
                getEventChannel(scope)(func,options,ctx);
            });
        };

        var getEachScope = function($el){
            var eachScopeName = 'each-scope'
                , eachScopeBinderDataName = binderDataName(eachScopeName);

            return $el.data( eachScopeBinderDataName );
        };

        this.getNs = function($el , forceNew){

            var fullNsDataName = binderDataName('full-ns');

            if($el.data(fullNsDataName) && !forceNew){

            }

            var fullNs = ''
                , scopeBinderName = binderName('scope')
                , scopeBinderDataName = binderDataName('scope')
                , $parents = $el.parents('['+scopeBinderName+']')
                , eachScope = getEachScope($el)
                , isPropVisit = function(ns){
                    return ns.indexOf('[') === 0;
                };

            if($el.attr( scopeBinderName )){
                fullNs = $el.data(scopeBinderDataName) || $el.attr(scopeBinderName);
            }

            if(eachScope){
                fullNs = eachScope;
            }

            if(fullNs.indexOf('$root.') == 0){
                return fullNs;
            }

            $parents.each(function(){
                var $parent = $(this)
                    , eachScope = getEachScope($parent)
                    , parentNs;
                if($parent.attr(scopeBinderName)){
                    parentNs = ($parent.data(scopeBinderDataName) || $parent.attr(scopeBinderName));
                }

                if(eachScope){
                    parentNs = eachScope;
                }

                fullNs = parentNs + ( !isPropVisit(fullNs) ?  '.' : '' ) + fullNs

                if(fullNs.indexOf('$root') >= 0){
                    return false;
                }
            });

            fullNs = fullNs.replace(/\.$/g,'');

            Mvvm.devInfo($el,'scope',fullNs);

            $el.data(binderName('ns'),fullNs);

            return fullNs;
        };

        var resolveAbsNs = function(ns, relativeNs){
            relativeNs = relativeNs || '';
            if(relativeNs.indexOf('$root') == 0){
                return relativeNs;
            }
            relativeNs = relativeNs.replace('$scope.','');

            if(!getSimpleReg().test(relativeNs)){
                relativeNs = '';
            }
            if(relativeNs.indexOf('$parent') < 0){
                return ns +'.' + relativeNs;
            }
            var nsPaths = ns.split('.');
            while(relativeNs.indexOf('$parent') == 0){
                nsPaths.pop();
                relativeNs = relativeNs.replace('$parent.','');
            }
            var pre = nsPaths.join('.');
            return pre + (/\]$/.test(pre) ? '':'.') + relativeNs;
        };

        this.getAbsNs = function($el, binder){
            var ns = this.getNs($el);
            var relativeNs = $el.attr(binderName(binder || 'bind'));
            return resolveAbsNs(ns,relativeNs);
        };

        var addBinder = this.addBinder.bind(this);

        addBinder('scope',function($el,value,options){
            var expression = options.expression;
            if(!getSimpleReg().test(expression)){
                expression = parseExpression(expression);
                var executeResult = executeExpression(expression, $el.parent());
                if(typeof  executeResult !== 'string'){
                    throw new Error('invalid scope value.', $el.selector+':'+$el[0].outerHTML);
                }
                var dependencies = findExpressionDependency( expression );
                var scopeDataName = binderDataName('scope');
                if(dependencies && dependencies.length || !$el.data(scopeDataName) ){
                    if(executeResult !== $el.data(scopeDataName)){
                        $el.data(scopeDataName, executeResult);
                        self.getNs($el,true);
                        initElement( $el , true );
                        return false;
                    }
                }
            }
        });

        addBinder('bind',function($el,value, options){
            if(options.sourceElement && $el.is(options.sourceElement)){
                if($el.is('input,select,textarea')){
                    return false;
                }
            }
            var val = value();
            if($el.is('input')) {
                if($el.is(':checkbox') || $el.is(':radio')){
                    $el.attr('checked' , $el.val() === val );
                }else{
                    $el.val(val);
                }
            } else if($el.is('textarea') || $el.is('select')){
                $el.val( val );
            } else if(!$el.attr(binderName('text')) && !$el.attr( binderName('html') )){
                $el.text(val);
            }
        });

        addBinder('text',function($el,value){
            $el.text(value());
        });

        addBinder('html', function($el, value){
            $el.html(value());
        });

        addBinder('each', {
            init: function($el,value, options){
                !avril.data($el[0]) && avril.data($el[0], $el.html());
                $el.children().attr(binderName('stop'),'true');
                if(!getSimpleReg().test(options.expression)){
                    var vScope = ('$root.av_'+avril.guid()).replace(/\-/g,'');
                    var eachScope = getEachScope($el);
                    if(!eachScope){
                        $el.data( binderDataName('each-scope') , vScope  );
                        initElement($el, true);
                        return false;
                    }
                }
                this.renderItems($el,value);
                this.subscribeArrayEvent($el,options);
            }
            , update: function($el,value){
                $el.html(avril.data($el[0]));
                this.renderItems($el,value);
            }
            , subscribeArrayEvent: function($el,options){
                var binder = this;
                var dependencies ;
                if(getSimpleReg().test(options.expression)){
                    dependencies = [self.getAbsNs($el, 'each')];
                }else{
                    dependencies = options.dependencies;
                }
                dependencies.each(function(dep){
                    var events = self.subscribeArray( dep );

                    events.push(function(item,options){
                        if(!$el.is(options.$sourceElement)){

                        }
                    });

                    events.remove(function(item,options){
                        if(!$el.is(options.$sourceElement)){

                        }
                    });

                    events.clear(function(options){
                        if(!$el.is(options.$sourceElement)){

                        }
                    });

                    events.concat(function(options){
                        if(!$el.is(options.$sourceElement)){

                        }
                    });

                });
            }
            , renderItems: function($el,value){
                $el.data(binderName(this.itemTemplateDataName),null);
                var binder = this;
                var guid = 'guid-' + avril.guid();
                var replaceMement = '<span>'+guid+'</span>';
                var $start = this.getStart(this.getTemplateSource($el));
                var items = value();

                if(!items || !(items instanceof Array)){
                    items = [];
                    self.setVal( self.getNs($el), items, null, true );
                }

                var itemTemplateHtml = binder.generateItem($el).attr(binderName('scope'),'[{scope}]')
                    .toArray()
                    .select(function(o){
                        return o.outerHTML;
                    }).join('');

                var itemsHtml = items.select(function(item, index){
                    return itemTemplateHtml.replace(/\[\{scope\}\]/g,'['+index+']');
                }).join('');

                $start.before(replaceMement);

                var currentElHtml = $el[0].innerHTML;

                $el[0].innerHTML = currentElHtml.replace(replaceMement, itemsHtml);

                self.bindDom($el);

            }
            , getStart : function($el){
                if($el.length == 1){
                    return $el;
                }
                else{
                    return $el.last();
                }
            }
            , eachItemAttrName :binderName('each-item')
            , itemTemplateDataName: 'av-each-item-template'
            , getTemplateSource : function($el){
                if($el.data(binderName(this.itemTemplateDataName))){
                    return $el.data(binderName(this.itemTemplateDataName));
                }
                var itemAttrName = this.eachItemAttrName;
                var $itemTemplate = $el.find('[' + itemAttrName + '=true]');
                if($itemTemplate.length == 0){
                    $itemTemplate = $el.children().attr(itemAttrName,'true');
                }
                $el.data(binderName(this.itemTemplateDataName), $itemTemplate);
                return $itemTemplate.hide();
            }
            , generateItem : function($el){
                return this.getTemplateSource($el).clone()
                    .removeAttr(binderName('stop')).attr(this.eachItemAttrName,"generated")
                    .show();
            }
        });

        addBinder('if',{
            init:function($el,value){
                value = value();
                var html = $el.html();
                avril.data($el[0], html);
                if(!value){
                    $el.html('');
                }
            }
            , update: function($el,value){
                var html = avril.data($el[0]);
                if(value()){
                    $el.html(html);
                    self.bindDom($el);
                }else{
                    $el.html('');
                }
            }
        });

        addBinder('visible',function($el,value){
            value()? $el.show() : $el.hide();
        });

        addBinder('visibleIf', {
            init: function($el,value){
                binders['if'].init($el, value);
                binders.visible.init($el,value);
            }
            , update: function($el,value){
                binders['if'].update($el, value);
                binders.visible.update($el,value);
            }
        });

        addBinder('template',{
            init: function(){

            }
            , update: function(){

            }
            , getTemplate: function(callback){

            }
        });

        addBinder('attr',function($el,value){
            value = value();
            $el.attr(value || {});
        });

        addBinder('style',function($el,value){
            $el.css(value() || {});
        });

        addBinder('css',function($el,value){
            value = value()||{};
            for(var k in value){
                $el[value[k]? 'addClass':'removeClass'](k);
            }
        });

        var addExpressionParser = this.addExpressionParser.bind(this);
        var addMagic = this.addMagic.bind(this);

        //add try expresion parser
        addExpressionParser(function(expression){
            var _tryReg = /\$try\((.+?)\)/g;
            if(_tryReg.test(expression)){
                expression = expression.replace(_tryReg, function(match,arg){
                    if(arg.indexOf('"') >=0 || arg.indexOf("'") >=0){
                        return match;
                    }else{
                        return '$try("'+arg+'")';
                    }
                });
            }
            return expression;
        });

        addMagic('$try', function(val){
            var $scope = this;
            return avril.object($scope).tryGetVal(val) || avril.object($scope.$root).tryGetVal(val) || '';
        });

        //add $scope or $root to simple expresion
        addExpressionParser(function(expression){
            if(getSimpleReg().test(expression) && !/^\d+/.test(expression)){
                if(expression.indexOf('$root') == 0){
                    return expression;
                }
                expression = '$scope.'+expression;
            }
            return expression;
        });

        addMagic('$guid', function(){
            return 'avril_'+ avril.guid().replace(/_/g,'');
        });

        addMagic('$random', function(){
            return Math.random();
        });

        addMagic('$parent', function(){
            var $parent = this.$el.parents(binderSelector('scope')).first();
            return getScope(this.$ns, $parent);
        });

        addMagic('$setVal', function(ns, val){
            self.setVal(ns,val);
            return val;
        });

        this.array = function(ns){

            var getArray = function(){
                var arr = self.getVal(ns);
                if(arr instanceof  Array){ return arr; }
                arr = [];
                self.setVal(ns, arr);
                return arr;
            }

            var outerAPI = {}, innerAPI = {
                push: function(item) {
                    getArray().push(item);
                }
                , concat:function(items) {
                    getArray().concat(items);
                }
                , remove: function(item) {
                    getArray().remove(item);
                }
                , clear: function() {
                    self.setVal(ns,[]);
                }
            };

            for(var opt in innerAPI){
                outerAPI[opt] = function(){
                    innerAPI.apply(innerAPI,arguments);
                    getEventChannel(optEvent(ns,opt))([]);
                }
            }

            return outerAPI;
        };

        this.subscribeArray = function (){
            var arrayApi = avril.object(self.array()).keys();
            return function(ns){
                var subscribers = {};
                arrayApi.each(function(opt){
                    subscribers[opt] = getEventChannel( optEvent(ns,opt) );
                });
                return subscribers;
            }
        }();

        this.getRootScope = function(){
            return $.extend(true, {}, _rootScopes.$root);
        };

    });

    Mvvm.defaults = {
        attr_pre: 'av'
        , show_error: false
        , trigger_events: 'change keyup'
        , show_dev_info : false
        , use_text_expression: false
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

    Mvvm.executeExpression = function(expression,ctx){
        return _evalExpression.call(ctx,expression);
    };

    avril.mvvm = avril.Mvvm();

})(jQuery, function(expression){
    with (this){
        try
        {
            return eval('('+ expression +')' );
        } catch (E){
            if(avril.Mvvm.defaults.show_error === true){
                throw E;
            }
            if(avril.Mvvm.defaults.errorHandler){
                avril.Mvvm.defaults.errorHandler(E);
            }
        }
    }
    return '';
});
