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
            },
            update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                !$(element).data(dataKey) && valueAccessor() && $(element).ready(valueAccessor()(element, viewModel)) && $(element).data(dataKey, true);
            }
        };
    })();

    /*popup*/
    (function () {
        ko.bindingHandlers.pop = {
            init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                var $element = $(element);
                $element.unbind('click').click(function (e) {

                    e.preventDefault();
                    var options = ko.utils.unwrapObservable(valueAccessor()) || {};
                    viewHelper.pop($element.attr('href'), $.extend({ title: '...' }, options));
                });
            },
            update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                var $element = $(element);
                $element.unbind('click').click(function (e) {
                    e.preventDefault();
                    var options = ko.utils.unwrapObservable(valueAccessor()) || {};
                    viewHelper.pop($element.attr('href'), $.extend({ title: '...' }, options));
                });
            }
        };
    })();

    /*parital*/
    (function () {
        /*
        <div data-bind="partial:{view:'/viewPath',data:'/dataPath'}">
        </div>
        */
        ko.bindingHandlers.partial = {
            init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                var options = ko.utils.unwrapObservable(valueAccessor()) || {};
                if (typeof options === 'string') {
                    options = {
                        view: options
                    };
                }

                avril.mvc.request.getViewTemplate(options.view, function (resTmpl) {
                    if (options.data) {
                        avril.mvc.request.getViewData(options.data, function (data) {
                            ko.bindingHandlers.template.init(element, ko.observable({
                                name: resTmpl.template
                                , data: data
                            }), allBindingsAccessor, viewModel, bindingContext);
                        });
                    } else {
                        ko.bindingHandlers.template.init(element, ko.observable({
                            name: resTmpl.template
                        }), allBindingsAccessor, viewModel, bindingContext);
                    }
                });
            }
            , update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                var options = ko.utils.unwrapObservable(valueAccessor()) || {};
                if (typeof options === 'string') {
                    options = {
                        view: options
                    };
                }
                avril.mvc.request.getViewTemplate(options.view, function (resTmpl) {
                    if (options.data) {
                        avril.mvc.request.getViewData(options.data, function (data) {
                            ko.bindingHandlers.template.update(element, ko.observable({
                                name: resTmpl.template
                                , data: data
                            }), allBindingsAccessor, viewModel, bindingContext);
                        });
                    } else {
                        ko.bindingHandlers.template.update(element, ko.observable({
                            name: resTmpl.template
                        }), allBindingsAccessor, viewModel, bindingContext);
                    }
                });
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
                needData: true
            }, popOptions));

            var pools = $.extend(avril.mvc.models.getPool(), {
                rootPools: avril.mvc
            });

            pop.show.onShow(function () {
                var hash = Backbone.history.getHash();
                var newHash = viewHelper.modal.addToUrl(hash, url);
                Backbone.history.navigate(newHash, false);
            });

            pop.hide.onHide(function () {
                popCache[url] = undefined;
                var hash = Backbone.history.getHash();
                var newHash = viewHelper.modal.removeFromUrl(hash, url);
                Backbone.history.navigate(newHash, false);
            });

            pop.events.onContentReady(function () {
                var $configScript = pop.$pop().find('[type="text/config"]');
                if ($configScript.length) {
                    try {
                        var config = eval('(' + $configScript.text() + ')');
                        pop.options(config);
                        console.log(config);
                    } catch (E) { }
                }
                if (pop.options().needData) {
                    request.getViewData(url, function (res) {
                        pools.model('dialogModel')(res);
                    });
                }
                if (pop.options().controller) {
                    pools.controller = avril.mvc.controllers.controller(pop.options().controller);
                }
                if (pop.options().model) {
                    pools.controller = avril.mvc.models.model(pop.options().model);
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