/**
 * Created by trump.wang on 2014/6/26.
 */
;(function($, _evalExpression, _compiledExpression){
    var Mvvm = avril.createlib('avril.Mvvm', function(options){

        var config = $.extend(this.options(), options, {
                guid: avril.guid()
            })
            , self = this
            , getHash = function(key){
                if(key){
                    if(key instanceof  jQuery){
                        key = key[0];
                    }
                    return 'hs_' + avril.getHash(key);
                }
                return key + '';
            }
            , guid = function(){
                return getHash({});
            }
            , binders = {}
            , getCacheProvider = function(){
                var _c = {};
                return function(name){
                    return function(key,value){
                        key = getHash(key);
                        if(arguments.length == 1){
                            return _c[name+'_'+key];
                        }else if(arguments.length == 2){
                            return _c[name+'_'+key] = value;
                        }
                    }
                }
            }()
            , expressionCacher = getCacheProvider('expression_cache')
            , binderCacher = getCacheProvider('expression_cache')
            , initedElementCacher = getCacheProvider('inited_element_cache')
            , htmlCacher = getCacheProvider('html_template_cache')
            , expressionParsers = []
            , magics = {
                global: {

                }
                , binders:{

                }
            }
            , getBinders = function($el){
                var binder = binderCacher($el);
                if(binder){
                    return binder;
                }
                var eachGroupId = $el.attr(binderName('each-item-group-id'));
                if(eachGroupId){
                    binder = binderCacher('group_'+eachGroupId);
                    if(binder){
                        return binder;
                    }
                }
                binder = {};
                self.selector.split(',').each(function(selector){
                    if( $el.is(selector)){
                        var binderName = selector.replace(/\[|\]/g,'').replace(Mvvm.defaults.attr_pre+'-','');
                        binder[binderName] = binders[binderName];
                    }
                });
                //binderCacher($el,binder);
                binderCacher('group_'+eachGroupId,binder);
                return binder;
            }
            ,  _rootScopes = {
                $root:{}
                , $controllers: {}
            }
            , _basicValueTypeReg = /^(true|false|null|undefined)$/
            , _expressionReg = /(\$data|\$scope|\$root)(\[\".+?\"\]|\[\'.+?\'\]|\[\d+\]|\.(\w+\d*)+)+/g
            , getSimpleReg = function(){ return /^((\[(\d+|\".+?\"|\'.+?\')\]|\w+\d*|\$)+(\.\w+\d*)*)+$/g; }
            , resolveAbsNs = function(ns, relativeNs){
                relativeNs = relativeNs || '';
                if(relativeNs.indexOf('$root') == 0){
                    return relativeNs;
                }
                relativeNs = relativeNs.replace('$scope.','');

                if(!getSimpleReg().test(relativeNs)){
                    relativeNs = '';
                }

                if(relativeNs === _optName('indexChange')){
                    ns = ns.replace(/\[\d+\]$/,'');
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
            }
            , findExpressionDependency = function(){
                var cache = {};
                return function(expression, onFind){
                    expression = expression.replace(/^\s+|\s+$/g,'');
                    if(cache[expression]){
                        return onFind? cache[expression].each(onFind) : cache[expression];
                    }
                    var watchers = [] , watcher;
                    var hasIndexReg = /\$index\(\s*\)/g;
                    if( hasIndexReg.test(expression) ){
                        watchers.push(watcher = _optName('indexChange'));
                    }
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
            , getScope = function(ns, $el, binder){
                var data = avril.object( _rootScopes ).tryGetVal(ns);
                var res = {};
                if(data && avril.isObj(data)){
                    if(avril.isArray(data)){
                        data.each(function(item,index){
                            res[index] = item;
                        });
                        res.length = data.length;
                    }else{
                        for(var k in data){
                            res[k] = data[k];
                        }
                    }
                }

                $.extend(true, res, magics.global);

                binder && $.extend(true, res, magics.binders[binder]);

                res.$root = _rootScopes.$root
                res.$ns = ns;
                res.$el = $el;
                res.$scope = data;

                return res;
            }
            , getElScope = function($el){
                $el = $($el);
                return getScope(getNs($el), $el);
            }
            , parseExpression = function (expression, binder){
                var cacheKey = expression = expression.trim();
                if( _basicValueTypeReg.test(expression)){
                    return expression;
                }
                if(!isNaN(expression)){
                    return expression;
                }
                if(expressionCacher(cacheKey)){
                    return expressionCacher(cacheKey);
                }
                if(binder && binders[binder] && binders[binder].expressionParser){
                    expression = binders[binder].expressionParser(expression);
                }
                binder && expressionParsers.binders
                && expressionParsers.binders[binder]
                && expressionParsers.binders[binder].each(function(parser){
                    expression = parser(expression);
                });
                expressionParsers.each(function(parser){
                    expression = parser(expression);
                });
                expressionCacher(cacheKey,expression);
                return expression;
            }
            , executeExpression = function(expression, $el,binder){
                expression = parseExpression(expression,binder);
                var ns = getNs($el);
                var ctx = getScope(ns,$el,binder);

                return Mvvm.executeExpression(expression,ctx);
            }
            , valueAccessor = function($el,expression,binder){
                return function(){
                    return executeExpression( expression , $el ,binder );
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
            , initElement = function( el , force ) {
                var $el = $(el);
                if(!Mvvm.elementExists($el)){
                    return true;
                }
                var stopAttrSelector = '['+binderName('stop')+']';
                if($el.is(stopAttrSelector) || $el.parents(stopAttrSelector).length){
                    return true;
                }
                if(initedElementCacher($el) && !force){
                    return true;
                }

                initedElementCacher($el, true);

                if($el.attr(binderName('delay')) === 'false'){
                    initElementBinderDependency($el);
                }else{
                    nextTick(function(){ Mvvm.elementExists($el) && initElementBinderDependency($el); });
                }
            }
            , initElementBinderDependency = function(){
                var nsCache = {}
                    , getOldNs = function($el){
                        return nsCache[ getHash($el) ];
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
                    var ns = getNs($el);
                    for(var bName in binders){
                        var expression = $el.attr(binderName(bName));
                        var dependencies = initDependency(expression , $el , bName ,ns , getOldNs($el), removeOldSubscribe);
                        binders[bName].init($el, valueAccessor($el,expression,bName),{
                            expression: expression
                            , ns: ns
                            , dependencies: dependencies
                        });
                    }
                    cacheNs($el, ns);
                }
            }()
            , initDependency = function(expression, $el, binder , ns , oldNs , removeOldSubscribe){
                var parsedExpressionStr = parseExpression(expression);
                var counter = 0;
                var subscribeDependency = function(absNs, dependenPath){
                    self.subscribe(absNs, function(newValue,oldValue,options){
                        if(!Mvvm.elementExists($el)){
                            if($el.is(binderDataName('each-item'))){

                            }
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
                        var absNs = resolveAbsNs(binder !== 'scope'? ns : getNs($el.parent()) , watchPath);
                        subscribeDependency(absNs, watchPath);
                        if(oldNs){
                            removeOldSubscribe( resolveAbsNs(oldNs, watchPath) , $el , oldNs );
                        }
                    }
                });
                return watchers;
            }
            , updateElement = function(el, updateOptions, binder){
                var $el = $(el);
                var binders = getBinders($el);
                var expression = $el.attr(binderName(binder));
                binders[binder].update($el, valueAccessor($el,expression,binder), $.extend(true,{},updateOptions,{
                    expression: expression
                    , binder: binder
                    , ns: getNs($el)
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
            , _eventPre = 'ave_' + config.guid
            , getEventChannel = function(subscribePath){
                return avril.event.get(subscribePath,_eventPre);
            }
            , _optName = function(opt){ return '__$$__' + config.guid + '__$$__' + opt; }
            , optEventName = function(ns,opt){ return ns + '.' + _optName(opt); }
            , getOptEventChannel = function(ns, opt){
                return getEventChannel( optEventName(ns, opt) );
            }
            , addBinderClass = function($el, binder){
                var css = binderName(binder) + '-css';
                $el.addClass(css);
            }
            , nextTick = function(func){
                setTimeout(func,1);
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
                    $('html').attr(attrPre+'-scope','$root').addClass('av-mvvm');
                }
            }()
            ;

        this.selector = selector();

        this.addBinder = function(name,binder, expressionParser){
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
            expressionParser = expressionParser || binder.expressionParser;
            if(avril.isFunc(expressionParser)) {
                expressionParser = expressionParser.bind(binder);
            }
            binders[name] = {
                init: binder.init.bind(binder)
                , update: binder.update.bind(binder)
                , expressionParser: expressionParser
            };
            this.selector = selector();
        };

        this.addExpressionParser = function(parser, binder){
            if(!binder){
                expressionParsers.push(parser);
            }else{
                expressionParsers.binders = expressionParsers.binders || {};
                expressionParsers.binders[binder] = expressionParsers.binders[binder] || [];
                expressionParsers.binders[binder].push(parser);
            }
        };

        this.addMagic = function(name, func, binder) {
            if(!name || name.indexOf('$')!= 0 ){
                throw "Magic method's name should start with '$'";
            }
            if(!binder){
                magics.global[name] = func;
            }else{
                if( !magics.binders[binder]){
                    magics.binders[binder] = {};
                }
                magics.binders[binder][name] = func;
            }
        };

        var _bindDom = function($el){

            !$el.is('html') && initElement($el);

            $el.find(self.selector).each(function(i){
                initElement(this);
            });

        }.bind(this);

        this.bindDom = function(el, forceDelay){
            bindGlobal();
            var $el = !el || el === document?  $('html') : $(el);

            if(forceDelay === true){
                return nextTick(function(){ _bindDom($el) })
            }else if( forceDelay === false ){
                return _bindDom($el);
            }

            //optimise the speed
            $el.attr(binderName('delay')) === 'false' ?
                _bindDom($el) : nextTick(function(){ _bindDom($el) });
        };

        this.setVal = function(ns, value , $sourceElement, silent) {
            var oldValue = avril.object(_rootScopes).tryGetVal(ns);
            if(oldValue != value){
                if(value){
                    if(typeof(value) ==='string' &&  !isNaN(value)){
                        value = Number(value);
                    }
                }
                avril.object(_rootScopes.$root).setVal(ns.replace(/^\$root\.?/,''), value);
                !silent && getEventChannel(ns)([ value, oldValue, { sourceElement: $sourceElement, channel: ns } ]);
            }
        };

        this.array = function(ns, $el) {
            var array = this.getVal(ns);
            if(!(array instanceof  Array)){
                array = [];
                this.setVal(ns, array, $el);
            }
            var options = {
                    sourceElement: $el
                }
                , triggerLengthChange = function(newLength,oldLength){
                    getEventChannel(ns+'.length')([ newLength,oldLength, { sourceElement: $el, channel:ns } ]);
                }
                , triggerIndexChange = function(){
                    events.indexChange([]);
                }
                ,api = {
                    add: function(item){
                        array.push(item);
                        getOptEventChannel(ns, 'add')([item, options]);
                        triggerLengthChange(array.length, array.length - 1);
                    }
                    , remove: function(item){
                        array.removeItem(item);
                        getOptEventChannel(ns, 'add')([item, options]);
                        triggerLengthChange(array.length, array.length + 1);
                        triggerIndexChange();
                    }
                    , concat: function(items){
                        for(var i=0;i++;i<items.length){
                            array.push(items[i]);
                        }
                        getOptEventChannel(ns,'concat')([items, options]);
                        triggerLengthChange(array.length, array.length - items.length);
                    }
                }
                , events = function(){
                    var e = {

                        }
                        , addEvent = function(opt){
                            e[opt] = function(){
                                if(typeof arguments[0] === 'function'){
                                    getOptEventChannel(ns, opt)(arguments[0], { $el: $el, ns: ns });
                                }else{
                                    getOptEventChannel(ns, opt)(arguments[0]);
                                }
                            };
                        };
                    addEvent('indexChange');
                    for(var k in api){
                        addEvent(k);
                    }
                    return e;
                }();

            api.events = events;

            return api;
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
            $el = $($el);
            var eachScopeName = 'each-scope'
                , eachScopeBinderDataName = binderDataName(eachScopeName)
                , eachScopeBinder = $el.attr(binderName('each'));

            if(eachScopeBinder && getSimpleReg().test(eachScopeBinder)){
                return eachScopeBinder.replace(/^\$scope(\.)?/,'');
            }

            return $el.data( eachScopeBinderDataName );
        };

        this.getNs = function($el){
            var fullNs = ''
                , scopeBinderName = binderName('scope')
                , scopeBinderDataName = binderDataName('scope')
                , $parents = $el.parents('['+scopeBinderName+'],['+binderName('each')+']')
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

                if(parentNs){
                    fullNs = parentNs + ( !isPropVisit(fullNs) && fullNs ?  '.' : '' ) + fullNs;
                }


                if(fullNs.indexOf('$root') >= 0){
                    return false;
                }
            });

            fullNs = fullNs.replace(/\.$/g,'');

            Mvvm.devInfo($el,'scope',fullNs);

            $el.data(binderName('ns'),fullNs);

            return fullNs;
        };

        this.getElScope = getElScope;

        var getNs = this.getNs.bind(this);

        this.getAbsNs = function($el, binder){
            var ns = this.getNs($el);
            var relativeNs = $el.attr(binderName(binder || 'bind'));
            return resolveAbsNs(ns,relativeNs);
        };

        this.getRootScope = function(){
            return $.extend(true, {}, _rootScopes.$root);
        };

        var addBinder = this.addBinder.bind(this)
            ,addExpressionParser = this.addExpressionParser.bind(this)
            ,addMagic = this.addMagic.bind(this);

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
                        getNs($el,true);
                        initElement( $el , true );
                        return false;
                    }
                }
            }
        });

        addBinder('if', {
            init:function($el,value){
                value = value();
                var html = $el.html();
                htmlCacher($el, html);
                if(!value){
                    $el.html('');
                }
            }
            , update: function($el,value){
                var html = htmlCacher($el);
                if(value()){
                    $el.html(html);
                    self.bindDom($el);
                }else{
                    $el.html('');
                }
            }
        });

        addBinder('visibleIf', {
            init: function($el,value){
                addBinderClass($el,'visible-if');
                binders['if'].init($el, value);
                binders.visible.init($el,value);
            }
            , update: function($el,value){
                binders['if'].update($el, value);
                binders.visible.update($el,value);
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

        addBinder('each', {
            init: function($el,value, options){
                if(!htmlCacher($el)){
                    this.getTemplateSource($el).attr(binderName('stop'),'true');
                    htmlCacher($el, $el.html());
                    $el.html('')
                }
                var isSimpleExpression = getSimpleReg().test(options.expression);
                if(!isSimpleExpression){
                    var vScope = '$root.av_'+guid();
                    var eachScope = getEachScope($el);
                    if(!eachScope){
                        $el.data( binderDataName('each-scope') , vScope  );
                        initElement($el, true);
                        return false;
                    }
                }
                this.renderItems($el,value);

                if(isSimpleExpression)
                    this.subscribeArrayEvent($el,options);
            }
            , update: function($el,value,options){
                if(options.sourceElement && $el.is(options.sourceElement)){
                    return false;
                }
                $el.html(htmlCacher($el));
                this.renderItems($el,value);
            }
            , subscribeArrayEvent: function($el,options){
                var ns = getNs($el);
                var arrayEvents = self.array(ns, $el).events;
                arrayEvents.add(function(){

                });
                arrayEvents.remove(function(){

                });
                arrayEvents.concat(function(){

                });
                arrayEvents.indexChange(function(){

                });
            }
            , renderItems: function($el,value){
                var items = value();
                if(!items || !(items instanceof Array)){
                    items = [];
                }
                self.setVal( getNs($el), items ,$el );
                $el.html(htmlCacher($el));
                $el.data(binderName(this.itemTemplateDataName),null);
                var binder = this;
                var guid = 'guid_' + avril.guid();
                var replaceMement = '<i>'+guid+'</i>';
                var $start = this.getStart(this.getTemplateSource($el));

                var itemTemplateHtml = binder.generateItem($el).attr(binderName('scope'),'[{scope}]')
                    .toArray()
                    .select(function(o){
                        return o.outerHTML;
                    }).join('');

                var itemsHtml = items.select(function(item, index){
                    return itemTemplateHtml.replace(/\[\{scope\}\]/g,'['+index+']');
                }).join('');

                $start.after(replaceMement);


                var currentElHtml = $el[0].innerHTML;

                $el[0].innerHTML = currentElHtml.replace(replaceMement, itemsHtml);

                self.bindDom($el, $el.attr(binderName('delay')) !== 'false' );
                
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
                var $itemTemplate = $el.children('[' + itemAttrName + '=true]');
                if($itemTemplate.length == 0){
                    $itemTemplate = $el.children().attr(itemAttrName,'true');
                }
                function addGroupId(){
                    $(this).attr( binderName('each-item-group-id'), getHash(this) );
                }

                $itemTemplate.find(self.selector).each(addGroupId);
                addGroupId.call($itemTemplate[0]);
                $itemTemplate.filter(self.selector).each(addGroupId);

                $el.data(binderName(this.itemTemplateDataName), $itemTemplate);
                return $itemTemplate.hide();
            }
            , generateItem : function($el){
                return this.getTemplateSource($el).clone()
                    .removeAttr(binderName('stop')).attr(this.eachItemAttrName,"generated")
                    .show();
            }
        });

        addBinder('text',function($el,value){
            $el.text(value());
        });

        addBinder('html', function($el, value){
            $el.html(value());
        });

        addBinder('visible',function($el,value){
            addBinderClass($el,'visible');
            value()? $el.show() : $el.hide();
        });

        addBinder('template',{
            init: function($el, value){
                this.render.apply(this,arguments);
            }
            , update: function($el, value){
                this.render.apply(this,arguments);
            }
            , render: function($el, value, options){
                var url = this.getTemplateUrl.apply(this,arguments);
                this.getTemplate(url, function(tmplStr){
                    $el.html(tmplStr);
                    self.bindDom($el);
                });
            }


            , isUrl : function(url){
                return this.urlReg.test('http://test.com' + (url.indexOf('/')===0? '' : '/') + url ) || urlReg.test(url);
            }
            , getTemplateUrl : function($el, value, options){
                return value() || options.expression ;
            }
            , getTemplate: function(url,callback){
                var binder = this;
                if(url.indexOf('#') === 0){
                    return callback( $(url).html() );
                }
                if(this.isUrl(url)){
                    if(this.cache[url]){
                        return callback(this.cache[url]);
                    }else{
                        $.ajax({
                            url:url
                            , success: function(html){
                                binder.cache[url] = html;
                                callback(binder.cache[url])
                            }
                        });
                    }
                }
            }
            , cache:{

            }
            // come from https://gist.github.com/dperini/729294
            , urlReg: new RegExp(
                    "^" +
                    // protocol identifier
                    "(?:(?:https?|ftp)://)" +
                    // user:pass authentication
                    "(?:\\S+(?::\\S*)?@)?" +
                    "(?:" +
                    // IP address exclusion
                    // private & local networks
                    "(?!(?:10|127)(?:\\.\\d{1,3}){3})" +
                    "(?!(?:169\\.254|192\\.168)(?:\\.\\d{1,3}){2})" +
                    "(?!172\\.(?:1[6-9]|2\\d|3[0-1])(?:\\.\\d{1,3}){2})" +
                    // IP address dotted notation octets
                    // excludes loopback network 0.0.0.0
                    // excludes reserved space >= 224.0.0.0
                    // excludes network & broacast addresses
                    // (first & last IP address of each class)
                    "(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])" +
                    "(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}" +
                    "(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))" +
                    "|" +
                    // host name
                    "(?:(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)" +
                    // domain name
                    "(?:\\.(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)*" +
                    // TLD identifier
                    "(?:\\.(?:[a-z\\u00a1-\\uffff]{2,}))" +
                    ")" +
                    // port number
                    "(?::\\d{2,5})?" +
                    // resource path
                    "(?:/\\S*)?" +
                    "$", "i"
            )
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

        addBinder('func', function($el, value){
            var func = value();
            if(avril.isFunc(func)){
                func($el);
            }
        }, function(expression){
            return expression+'.bind(this)';
        });

        addBinder('event', {
            init: function($el,value){
                var events = value();
                if(events) {
                    for(var e in events) {
                        $el.on( e, events[e] );
                    }
                }
            }
        });

        //add try expresion parser
        addExpressionParser(function(expression){
            var _tryReg = /\$(tryGet)\((.+?)\)/g;
            if(_tryReg.test(expression)){
                expression = expression.replace(_tryReg, function(match,method,arg){
                    if(arg.indexOf('"') >=0 || arg.indexOf("'") >=0){
                        return match;
                    }else{
                        return '$'+ method +'("'+arg+'")';
                    }
                });
            }
            return expression;
        });

        addMagic('$tryGet', function(val){
            var $scope = this;
            return avril.object($scope).tryGetVal(val) || avril.object($scope.$root).tryGetVal(val) || '';
        });

        //add $scope or $root to simple expresion
        addExpressionParser(function(expression){
            if(getSimpleReg().test(expression) && !/^\d+/.test(expression)){
                if(expression.indexOf('$root') == 0){
                    return expression;
                }
                if(expression.indexOf('$scope')<0){
                    expression = '$scope.'+expression;
                }
            }
            return expression;
        });

        addMagic('$guid', function(){
            return 'av_guid'+ avril.guid().replace(/_/g,'');
        });

        addMagic('$randomScope', function(){
            return '$root.rdm'+avril.guid().replace(/_/g,'');
        });

        addMagic('$parent', function(selector){
            var $parent = selector ? this.$el.parents(selector).first()
                : this.$el.parents(binderSelector('scope')).first();

            return getElScope($parent);
        });

        addMagic('$setVal', function(relativePath, val){
            self.setVal(resolveAbsNs(this.$ns, relativePath),val);
            return val;
        });

        addMagic('$avArray', function(ns){
            if(arguments.length ===0 ){
                ns = this.$ns;
            }
            return self.array(ns,this.$el);
        });

        addMagic('$index', function(ns){
            var $el = this.$el;

            while(!$el.is('[' + binderName('each-item') +']' ) && $el.length && !$el.is('body') ){
                $el = $el.parent();
            }

            if($el.length){
                var scopeIndex = $el.attr( binderName('scope') );
                var groupItems = $el.parent().children('['+binderName('scope')+'="'+scopeIndex+'"]');
                var allSiblings = $el.parent().children('['+binderName('each-item')+'="generated"]');
                if(groupItems.length==1){
                    return allSiblings.index($el);
                }else if(groupItems.length>1){
                    return allSiblings.index(groupItems.first()) / groupItems.length;
                }
            }

            return 0;
        });

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
        //return _evalExpression.call(ctx,expression);
        return _compiledExpression(expression).call(ctx);
    };

    avril.mvvm = avril.Mvvm();

})(jQuery
, function(expression){
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
}
, function(){
    var cache = {};
    return function(expression) {
        if(cache[expression]){
            return cache[expression];
        }
        try{
            return cache[expression] = new Function(
                'with (this){\n\
                    try{\n\
                        return '+expression+';\n\
                    } catch (E){\n\
                        if(avril.Mvvm.defaults.show_error === true){\n\
                            throw E;\n\
                        }\n\
                        if(avril.Mvvm.defaults.errorHandler){\n\
                            avril.Mvvm.defaults.errorHandler(E);\n\
                        }\n\
                        return \'\';\n\
                    \n}\
                \n}'
            );
        }catch (E){
            return cache[expression] = function(){
            };
        }
    }
}());
