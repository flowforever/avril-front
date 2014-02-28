/// <reference path="../../scripts/_references.js" />

(function () {
    avril.namespace('avril.mvc.viewHelper');
    var viewHelper = avril.mvc.viewHelper, request = avril.mvc.request;

    //#region bindingHandlers

    /*init*/
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


    /*post*/
    (function () {
        ko.bindingHandlers.post = {
            init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) { }
        };
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
                needData: true
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

            request.getViewTemplate(url, function (res) {
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