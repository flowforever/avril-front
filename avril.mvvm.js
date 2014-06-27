/**
 * Created by trump.wang on 2014/6/26.
 */
;(function($, win){

    avril.namespace('avril.mvvm');

    avril.createlib('avril.mvvm.TemplateParser',function(options){
        var cfg = $.extend(this.options(), {
                /* default config */
                commentPre: 'av'
                , attrPre: 'av-'
                , debug: true
            } , options)
            , self = this
            , getCommentNodeValue = function (node) {
                return node.nodeValue ? node.nodeValue.replace(/^\s*/g,'').replace(/\s*$/g,'') : '';
            }
            , isCommentTag = function(node) {
                return getCommentNodeValue(node).indexOf(cfg.commentPre) === 0;
            }
            , isAvNode = function(node) {
                if(node.nodeType == 8) {
                    return isCommentTag(node);
                } else {
                    return avril.object.toArray(node.attributes).ex().first(function(attr){
                        return attr.name.indexOf(cfg.attrPre) == 0;
                    }) !== null;
                }
            }
            , getNodeAvAttr = function(node){
                if(isCommentTag(node)){
                    var nodeValue = '{' + getCommentNodeValue(node).replace('av','') + '}'
                    try{
                        return eval('('+nodeValue+')');
                    }catch (E){
                        cfg.debug && ( avril.log('Error element:')
                                || avril.log(node)
                                || avril.log('compiled as:')
                                || avril.log(nodeValue)
                                || avril.log('Error info:')
                                || avril.error(E.message)
                                || avril.error(E.stack)
                                || avril.log('\n'));

                        return {};
                    }
                }else{
                    var attrs = {};
                    avril.array(node.attributes).where(function(attr){
                        attrs[attr.name.replace(cfg.attrPre,'')] = attr.value;
                    });
                    return attrs;
                }
            }
            , searchNode = function(dom, controller){
                dom.avController = controller;
                avril.object( dom.childNodes ).toArray().ex().each(function(node,index){
                    var attrs = {};
                    isAvNode(node) && (attrs = getNodeAvAttr(node)) &&!attrs.stop && parse(node, attrs);
                    if(!attrs.stop && node.childNodes) {
                        searchNode(node,controller);
                    }
                });
            }
            , parse = function(node, attrs){
                console.log(attrs);
            };

        this.parse = function(dom,controller){
            searchNode(dom,controller);
        };
    });

    avril.mvvm.templateParser = avril.mvvm.TemplateParser();

    avril.mvvm.parse = function (dom,controller){
        if(dom.jquery){
            dom.each(function(index,el){
                avril.mvvm.templateParser.parse(el,controller);
            });
        }else if(typeof dom === 'string'){
            avril.mvvm.parse($(dom),controller);
        } else {
            avril.mvvm.templateParser.parse(dom,controller);
        }
    };

})(jQuery, window);
