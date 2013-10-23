/// <reference path="avril.js" />
/// <reference path="avril.tools.js" />


(function (avril) {
    String.prototype.localize = function () {
        return $(avril.ui.helper.$span().html(this.toString()).localize())[0].outerHTML;
    }
    avril.toArray = function (arg) {
        var arr = [];
        if (arg.length) {
            for (var i = 0; i < arg.length; i++) {
                arr.push(arg[i]);
            }
        }
        return arr;
    }
})(avril);


avril.namespace('avril.ui');

//#region avril.ui.helper
(function (avril) {
    var datakey = 'localizeKey';

    $.fn.localize = function (group) {
        var self = this;

        this.data(datakey, this.data(datakey) || this.html());

        this.attr('data-localize', 'false');

        if (group) {
            this.attr('data-loaclize-group', group);
        }

        avril.tools.localize.parse(self);

        return this;
    }

    var helper = avril.ui.helper = {
        divStr: '<div/>'
                , linkStr: '<a/>'
                , tagBuilder: function (tag, attrs) {
                    var $el = $(this.tagStr[tag]);
                    if (attrs) {
                        $el.attr(attrs);
                    }
                    return $el;
                }
                , localize: {}
                , tagStr: {}
    };

    //#region tags
    var tags = 'a,abbr,acronym,address,applet,area,b,base,basefont,bdo,big,blockquote,body,br,button,canvas,caption,center,cite,code,col,colgroup,dd,del,dfn,dir,div,dl,dt,em,fieldset,font,form,frame,frameset,h1,h2,h3,h4,h5,h6,head,hr,html,i,iframe,img,input,ins,isindex,kbd,label,legend,li,link,map,menu,meta,noframes,noscript,object,ol,optgroup,option,p,param,pre,q,s,samp,script,select,small,span,strike,strong,style,sub,sup,table,tbody,td,textarea,tfoot,th,thead,title,tr,tt,u,ul,var';
    //#endregion

    tags.split(',').each(function (tag) {
        var fnName = '$' + tag;
        helper.tagStr[tag] = '<' + tag + '/>';
        helper[fnName] = function (attrs) {
            return helper.tagBuilder(tag, attrs);
        }
        helper.localize[fnName] = function (options, group) {
            var $el = helper[fnName].apply(helper, arguments);
            $el.localize(group);
            return $el;
        }
    });

    (function special() {
        var org$a = helper.$a;
        helper.$a = function (attrs) {
            if (!attrs || !attrs.href) {
                attrs = attrs || {};
                attrs.href = 'javascript:;';
            }
            org$a.call(helper, attrs);
        }
    })();
})(avril);
//#endregion

//#region avril.ui.msg
(function ($, avril) {
    avril.createlib('avril.ui.msg', function (options) {
        var config = $.extend(true, this.options(), {
            $container: 'body'
        }, options)
        , generateMsg = function () {
            $msg = $('<div class="alert" style="display:none;"> <button type="button" class="close" data-dismiss="alert">×</button> <strong/>:  <span/>  </div>').attr('guid', avril.guid());
            $msg.find('button').click(function () {
                $msg.fadeOut();
            });
        }
        , $msg;

        this._parseConfig();

        function setMsg($msg, msg) {
            $msg.show();
            $msg.removeClass('alert-success alert-error alert-info').addClass('alert-' + msg.type);
            $msg.find('strong').html(msg.title);
            $msg.find('span').html(msg.msg);
        }

        this.show = function ($container, msg) {
            if (arguments.length == 1) {
                msg = arguments[0];
                $container = this.$container();
            } else if (arguments.length == 2) {
                config.$container = $container;
            }
            if ($container.children('div.alert').length == 0) {
                generateMsg();
                $msg.prependTo($container);
            } else {
                $msg = $container.find('div.alert');
            }
            setMsg($msg, msg);
            return this;
        }

        this.showInBody = function (msg) {
            config.$container = 'body';
            this.show('body', msg);
            return this;
        }
    });
})(jQuery, avril);
//#endregion

//#region avril.ui.pop
(function ($, avril) {
    //#region private
    var popList = []
    , _divStr = '<div style="display:none;"><div class="modal-backdrop fade in"></div> \
                 <div class="modal"> \
                  <div class="modal-header"> \
                    <button type="button" class="close">×</button> \
                    <h3>Untitle</h3> \
                  </div> \
                  <div class="modal-body"> \
                    \
                  </div> \
                </div></div>';
    //#endregion

    avril.createlib('avril.ui.pop', function (options) {
        var config = $.extend(this.options(), {
            autoSize: true
            , $handle: null
            , draggable: true
            , resizable: true
            , effect: 'puff'
            , effectTime: 450
            , easing: 'easeInExpo'
            , title: ''
        }, options)
        , disabled = false
        , self = this
        , $modal = function () {
            return self.$pop().find('.modal')
        }
        , $body = function () {
            return $modal().find('.modal-body');
        }
        , $header = function () {
            return $modal().find('.modal-header');
        };

        this._parseConfig($);

        this.$modal = $modal;

        this.$body = $body;

        this.$header = $header;

        this.$pop = function ($pop) {
            if ($pop) {
                this._$pop = $pop;
            }
            return $(this._$pop);
        }

        this.init = function () {
            if (!this._inited) {

                var $pop = this.$pop($(_divStr).appendTo('body'));

                initHandle(this.$handle());

                initDraggable();

                initResizable();

                initSize(config.width, config.height);

                initTitle(config.title);

                self.events.onLoadHandle(function () {
                    $body().find('.close,.close-pop,button[type=reset]').click(function () {
                        self.hide();
                    });
                    initSize(config.width, config.height);
                });

                this._inited = true;
            }
            return this;
        }

        this.load = function (url, callback) {
            function onLoaded(res) {

                if (self.events.onLoad([res])) {

                    self.$pop().find('div.modal-body').html(res);

                    var $title = self.$pop().find('.modal-body h3:eq(0)').hide();

                    self.$pop().find('.modal-header h3:eq(0)').html($title.html());

                    self.events.onLoadHandle([self.$pop(), self]);

                    self.events.onContentReady([]);

                    if (callback) { callback(); };
                }

            }

            this.events.beforeLoad([self]) && $.ajax({
                url: url
                , success: onLoaded
                , error: function () {
                    self.hide();
                }
            });
        }

        this.show = function () {

            popList.push(this);

            this.init();

            this.$pop().show();

            this.$pop().find('.modal-backdrop').css('z-index', avril.ui.getZindex() + 2).css('opacity', 0.6);

            this.$pop().find('.modal').hide()
                .show(config.effect, { to: self.$handle(), easing: config.easing }, config.effectTime, function () {

                    self.$pop().find('.modal-backdrop').css('z-index', avril.ui.getZindex() + 1)

                    self.$pop().find('.modal').css('z-index', avril.ui.getZindex() + 1);

                });

            this.$pop().find('.close,.close-pop,button[type=reset]').click(function () {
                self.hide();
            });
        }

        this.hide = function () {

            popList.remove(function (item) { return item == self; });

            this._inited = false;

            this.$pop().find('.modal').hide(config.effect, { to: self.$handle(), easing: config.easing }, config.effectTime, function () {
                self.$pop().remove();
            });
        }

        this.disable = function () {
            disabled = true;
        }

        //private
        var initHandle = function ($handle) {
            if ($handle && $handle.length) {
                var href = $handle.attr('href')
                    , isEl = false;

                if (href.indexOf('#') > 0) {
                    config.$pop = href.substring(href.indexOf('#'));
                    isEl = true;
                }

                $handle.click(function (e) {
                    e.preventDefault();
                    if (!isEl) { self.load($(this).attr('href')); }
                    self.show();
                });
            }
        }

        var initDraggable = function () {
            self.$pop().find('.modal').draggable({ handle: ".modal-header h3" });
            if (!config.draggable) {
                self.$pop().find('.modal').draggable('disable');
                self.$pop().find('.modal').removeClass('ui-state-disabled');
            }
        }

        var initResizable = function () {
            self.$pop().find('.modal').resizable();
            if (!config.resizable) {
                self.$pop().find('.modal').resizable('disable');
                self.$pop().find('.modal').removeClass('ui-state-disabled');
            }
        }

        var initSize = function (width, height) {
            if (width !== undefined) {
                $modal().width(width);
            }
            if (height !== undefined) {
                $modal().height(height);
            }
        }

        var initTitle = function (title) {
            return $header().find('h3').html(title);
        }

        var makePositionCenter = function () {
            var $popWin = self.$pop().find('.modal')
                , winHeight = $(window).height()
                , winWidth = $(window).width()
                , popWidth = $popWin.width()
                , popHeight = $popWin.height();


            var top = 0, left = 0;

            if (winHeight > popHeight) {
                top = (winHeight - popHeight) / 2;
            }

            $popWin.css({
                position: 'absolute'
                , top: top + 'px'
            });
        }

        this.makePositionCenter = makePositionCenter;

        self.hook('show,hide');

        this.events.beforeLoad = avril.event.get('beforeLoad', this);

        this.events.onLoad = avril.event.get('onLoad', this);

        this.events.onLoadHandle = avril.event.get('onLoadHandle', this);

        this.events.onContentReady = avril.event.get('onContentReady', this);

        this.events.onHide = avril.event.get('onHide', this);

        this.events.onOptionChange(function (key, newConfig, oldConfig) {
            switch (key) {
                case 'content': {
                    self.$pop().find('.modal-body').html(newConfig[key]);
                    avril.tools.localize.parse(self.$pop());
                    self.events.onLoadHandle([self.$pop(), self]);
                    self.events.onContentReady([]);
                    break;
                }
                case 'title': {
                    initTitle(newConfig[key]);
                    break;
                }
                case 'width': {
                    initSize(newConfig[key]);
                    break;
                }
                case 'height': {
                    initSize(undefined, newConfig[key]);
                    break;
                }
                case 'draggable': {
                    initDraggable();
                    break;
                }
                case 'resizable': {
                    initResizable();
                }
            }
        });

        this.show.onShow(function () {
            setTimeout(makePositionCenter, 500);
        });

        $(window).resize(makePositionCenter);
    });

    function initDialog(pop) {
        if (pop.options().buttons) {
            var self = pop, config = pop.options(), $footer = function () {
                var $footer = pop.$pop().find('.modal-footer');

                if (!$footer.length) {
                    pop.$pop().find('.modal-body').after($('<div class="modal-footer"></div>'));
                    $footer = pop.$pop().find('.modal-footer');
                }

                return $footer;
            };

            pop.onButtonClick = avril.event.get('onButtonClick', pop);

            if (config.buttons) {
                var $buttonArea = $footer();
                $buttonArea.html('');
                config.buttons.each(function (obj) {
                    var name = obj;
                    var text = obj;
                    var cls = 'btn';
                    if (typeof obj == 'object') {
                        name = obj.name;
                        text = obj.text;
                        cls = obj.cls = obj.cls || 'btn';
                        if (typeof obj.fun == 'function') {
                            self.onButtonClick(function (n, el) {
                                if (n == name) {
                                    obj.fun(n, el);
                                }
                            });
                        }
                    }
                    $('<a href="javascript:;"/>').addClass(cls).html(text).localize()
                    .click(function () {
                        self.onButtonClick([name, $(this)]);
                    }).appendTo($buttonArea);

                });
            }

            pop.$pop().find('.modal').css('min-height', 'none');
        }
    }

    avril.alert = function (msg, func) {
        func = func || function () { }
        var $alert = avril.ui.pop({
            width: 300
            , height: 200
            , resizable: false
            , alert: 'Alert'
            , title: 'Alert'
            , buttons: [
                { text: 'OK', name: 'OK', cls: 'btn btn-primary' }
            ]
            , showFooter: true
        }).init();

        $alert.$header().find('h3').localize()

        initDialog($alert);

        $alert.options('content', msg).show();
        $alert.onButtonClick(function (name, el) {
            func();
            $alert.hide();
        });
        $alert.$pop().find('a:eq(0)').focus();
    }

    avril.confirm = function (msg, func) {
        func = func || function () { }
        var $confirm = avril.ui.pop({
            width: 320
            , height: 180
            , resizable: false
            , title: 'Confirm'
            , buttons: [
                 { text: 'Confirm', name: 'Confirm', cls: 'btn btn-primary' },
                 { text: 'Cancel', name: 'Cancel', cls: 'btn btn-danger' },
            ]
            , showFooter: true
        }).init();

        $confirm.$header().find('h3').localize()

        initDialog($confirm);

        $confirm.options('content', msg).show();
        $confirm.onButtonClick(function (name, $el) {
            switch (name) {
                case 'Confirm': {
                    func(true);
                    $confirm.hide();
                    break;
                }
                case 'Cancel': {
                    func(false);
                    $confirm.hide();
                    break;
                }
            }
        });
        $confirm.$pop().find('a:eq(0)').focus();
    }

    avril.prompt = function (msg, func, defaultValue) {
        func = func || function () { }
        var $confirm = avril.ui.pop({
            width: 320
            , height: 180
             , resizable: false
            , title: 'Prompt'
            , buttons: [
                 { text: 'Ok', name: 'Ok', cls: 'btn btn-primary' },
                 { text: 'Cancel', name: 'Cancel', cls: 'btn btn-danger' },
            ]
            , showFooter: true
        }).init();
        $confirm.$header().find('h3').localize()
        initDialog($confirm);
        $confirm.options('content', msg + '<br/><br/><input class="input-xxlarge" value="' + (defaultValue || '') + '" /> ').show();

        function ok() {
            var res = func($confirm.$body().find('input').val()) !== false;
            if (res) $confirm.hide();
        }

        $confirm.$pop().find('input').keyup(function (e) {
            e.keyCode == 13 && ok();
        });
        $confirm.onButtonClick(function (name, $el) {
            switch (name) {
                case 'Ok': {
                    ok();
                    break;
                }
                case 'Cancel': {
                    $confirm.hide(false);
                    break;
                }
            }
        });
    }

    avril.ui.pop.open = function (url) {
        var pop = new avril.ui.pop();
        pop.load(url); pop.show()
    }

    avril.ui.pop.toJQ('pop', function (options) {
        if (this.attr('data-pop')) {
            try {
                $.extend(true, options, eval('(' + this.attr('data-pop') + ')'));
            }
            catch (E) { }
        }
        options.$handle = this;
    });

    avril.ui.popContext = {
        popList: function () {
            return popList;
        }
        , getCurrent: function () {
            return popList && popList.length ? popList[popList.length - 1] : null;
        }
    };
})(jQuery, avril);
//#endregion

//#region avril.cookie
(function (avril) {
    avril.namespace('avril.ui');
    avril.ui.cookie = {
        get: function (name) {
            var arr = document.cookie.match(new RegExp("(^| )" + name + "=([^;]*)(;|$)"));
            if (arr != null) return unescape(arr[2]); return null;
        }
        , set: function (name, value, days) {
            days = days || 30;
            var exp = new Date();
            exp.setTime(exp.getTime() + days * 24 * 60 * 60 * 1000);
            document.cookie = name + "=" + escape(value) + ";expires=" + exp.toGMTString();
        }
        , del: function (name) {
            var exp = new Date();
            exp.setTime(exp.getTime() - 1);
            var cval = this.get(name);
            if (cval != null) document.cookie = name + "=" + cval + ";expires=" + exp.toGMTString();
        }
        , getObj: function (key) {
            return window.JSON ? window.JSON(this.get(key)) : eval('(' + this.get(key) + ')');
        }
        , setObj: function (key, obj) {
            this.set(key, window.JSON ? window.JSON.stringify(obj) : $.toJSON(obj));
        }
    };
})(avril);
//#endregion

//#region avril.ui.progressbar
(function ($, avril) {
    avril.createlib('avril.ui.progressbar', function (options) {
        var config = $.extend(true, this.options(), {
            auto: true
            , stop: false
        }, options)
        , $el = avril.ui.helper.$div().css({
            width: config.width || 250
            , height: config.height || 20
            , position: config.position || 'fixed'
            , bottom: config.bottom || 0
            , right: config.right || 0
            , display: 'none'
        }).appendTo('body')
        , self = this
        , guid = avril.guid()
        , interval;

        $el.progressbar();

        function run() {

            stop();

            config.stop = false;
            var i = 0;
            interval = setInterval(function () {
                if (i++ == 100) {
                    i = 0;
                }
                if (!config.stop) {
                    $el.progressbar("value", i);
                    $el.css('z-index', avril.ui.getZindex() + 2);
                }
            }, 50);
        }

        function stop() {
            config.stop = true;
            try {
                clearInterval(interval);
            } catch (E) { }
        }

        if (config.auto) {
            run();
        }

        this.show = function () {

            $el.show();
            run();
            return this;
        }

        this.hide = function () {
            $el.hide();
            stop();
            return this;
        }

        this.$el = $el;
    }, {
        bottom_right: (function () {
            var ins;
            return function () {
                if (!ins) {
                    ins = avril.ui.progressbar();
                }
                return ins;
            }
        })()
    });
})(jQuery, avril);
//#endregion

//#region avril.ui.ajaxFrame
(function ($, avril) {
    //#region jquery.hashchange
    (function ($, window, undefined) {
        '$:nomunge'; // Used by YUI compressor.

        // Reused string.
        var str_hashchange = 'hashchange',

    // Method / object references.
    doc = document,
    fake_onhashchange,
    special = $.event.special,

    // Does the browser support window.onhashchange? Note that IE8 running in
    // IE7 compatibility mode reports true for 'onhashchange' in window, even
    // though the event isn't supported, so also test document.documentMode.
    doc_mode = doc.documentMode,
    supports_onhashchange = 'on' + str_hashchange in window && (doc_mode === undefined || doc_mode > 7);

        // Get location.hash (or what you'd expect location.hash to be) sans any
        // leading #. Thanks for making this necessary, Firefox!
        function get_fragment(url) {
            url = url || location.href;
            return '#' + url.replace(/^[^#]*#?(.*)$/, '$1');
        };

        $.fn[str_hashchange] = function (fn) {
            return fn ? this.bind(str_hashchange, fn) : this.trigger(str_hashchange);
        };

        $.fn[str_hashchange].delay = 50;

        // Override existing $.event.special.hashchange methods (allowing this plugin
        // to be defined after jQuery BBQ in BBQ's source code).
        special[str_hashchange] = $.extend(special[str_hashchange], {
            // Called only when the first 'hashchange' event is bound to window.
            setup: function () {
                // If window.onhashchange is supported natively, there's nothing to do..
                if (supports_onhashchange) { return false; }

                // Otherwise, we need to create our own. And we don't want to call this
                // until the user binds to the event, just in case they never do, since it
                // will create a polling loop and possibly even a hidden Iframe.
                $(fake_onhashchange.start);
            },

            // Called only when the last 'hashchange' event is unbound from window.
            teardown: function () {
                // If window.onhashchange is supported natively, there's nothing to do..
                if (supports_onhashchange) { return false; }

                // Otherwise, we need to stop ours (if possible).
                $(fake_onhashchange.stop);
            }
        });

        // fake_onhashchange does all the work of triggering the window.onhashchange
        // event for browsers that don't natively support it, including creating a
        // polling loop to watch for hash changes and in IE 6/7 creating a hidden
        // Iframe to enable back and forward.
        fake_onhashchange = (function () {
            var self = {},
      timeout_id,

      // Remember the initial hash so it doesn't get triggered immediately.
      last_hash = get_fragment(),

      fn_retval = function (val) { return val; },
      history_set = fn_retval,
      history_get = fn_retval;

            // Start the polling loop.
            self.start = function () {
                timeout_id || poll();
            };

            // Stop the polling loop.
            self.stop = function () {
                timeout_id && clearTimeout(timeout_id);
                timeout_id = undefined;
            };

            // This polling loop checks every $.fn.hashchange.delay milliseconds to see
            // if location.hash has changed, and triggers the 'hashchange' event on
            // window when necessary.
            function poll() {
                var hash = get_fragment(),
        history_hash = history_get(last_hash);

                if (hash !== last_hash) {
                    history_set(last_hash = hash, history_hash);

                    $(window).trigger(str_hashchange);
                } else if (history_hash !== last_hash) {
                    location.href = location.href.replace(/#.*/, '') + history_hash;
                }

                timeout_id = setTimeout(poll, $.fn[str_hashchange].delay);
            };

            // vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv
            // vvvvvvvvvvvvvvvvvvv REMOVE IF NOT SUPPORTING IE6/7/8 vvvvvvvvvvvvvvvvvvv
            // vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv
            $.browser.msie && !supports_onhashchange && (function () {
                // Not only do IE6/7 need the "magical" Iframe treatment, but so does IE8
                // when running in "IE7 compatibility" mode.

                var iframe,
        iframe_src;

                // When the event is bound and polling starts in IE 6/7, create a hidden
                // Iframe for history handling.
                self.start = function () {
                    if (!iframe) {
                        iframe_src = $.fn[str_hashchange].src;
                        iframe_src = iframe_src && iframe_src + get_fragment();

                        // Create hidden Iframe. Attempt to make Iframe as hidden as possible
                        // by using techniques from http://www.paciellogroup.com/blog/?p=604.
                        iframe = $('<iframe tabindex="-1" title="empty"/>').hide()

            // When Iframe has completely loaded, initialize the history and
            // start polling.
            .one('load', function () {
                iframe_src || history_set(get_fragment());
                poll();
            })

            // Load Iframe src if specified, otherwise nothing.
            .attr('src', iframe_src || 'javascript:0')

            // Append Iframe after the end of the body to prevent unnecessary
            // initial page scrolling (yes, this works).
            .insertAfter('body')[0].contentWindow;

                        // Whenever `document.title` changes, update the Iframe's title to
                        // prettify the back/next history menu entries. Since IE sometimes
                        // errors with "Unspecified error" the very first time this is set
                        // (yes, very useful) wrap this with a try/catch block.
                        doc.onpropertychange = function () {
                            try {
                                if (event.propertyName === 'title') {
                                    iframe.document.title = doc.title;
                                }
                            } catch (e) { }
                        };
                    }
                };

                // Override the "stop" method since an IE6/7 Iframe was created. Even
                // if there are no longer any bound event handlers, the polling loop
                // is still necessary for back/next to work at all!
                self.stop = fn_retval;

                // Get history by looking at the hidden Iframe's location.hash.
                history_get = function () {
                    return get_fragment(iframe.location.href);
                };

                // Set a new history item by opening and then closing the Iframe
                // document, *then* setting its location.hash. If document.domain has
                // been set, update that as well.
                history_set = function (hash, history_hash) {
                    var iframe_doc = iframe.document,
          domain = $.fn[str_hashchange].domain;

                    if (hash !== history_hash) {
                        // Update Iframe with any initial `document.title` that might be set.
                        iframe_doc.title = doc.title;

                        // Opening the Iframe's document after it has been closed is what
                        // actually adds a history entry.
                        iframe_doc.open();

                        // Set document.domain for the Iframe document as well, if necessary.
                        domain && iframe_doc.write('<script>document.domain="' + domain + '"</script>');

                        iframe_doc.close();

                        // Update the Iframe's hash, for great justice.
                        iframe.location.hash = hash;
                    }
                };
            })();
            // ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
            // ^^^^^^^^^^^^^^^^^^^ REMOVE IF NOT SUPPORTING IE6/7/8 ^^^^^^^^^^^^^^^^^^^
            // ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

            return self;
        })();
    })(jQuery, this);
    //#endregion

    avril.createlib('avril.ui.ajaxframe', function (options) {
        var config = $.extend(this.options(), {
            identifyPre: '#/'
            , $container: '#ajax-container'
            //, effect: 'clip'
            , showEffect: 'slide'
            , hideEffect: 'slide'
            , enabled: true
            , cache: false
        }, options)
        , self = this
        , _firstContent
        , cache = {}
        , triggerChange = true;

        this._parseConfig();

        function _isAjaxHash() {
            var hash = window.location.hash;
            if (hash.indexOf(config.identifyPre) == 0) {
                return true;
            }
            return false;
        }

        function _getUrl() {
            return window.location.hash.substring(1);
        }

        function _getCache(url) {
            return cache[url || _getUrl()];
        }

        function setContent(html, hasEffect) {
            if (hasEffect != false) {
                self.$container()
                .hide(config.hideEffect || config.effect, function () {
                    self.$container().html(html);
                    self.onLoad([self, self.$container()]);

                    self.$container().show(config.showEffect || config.effect);
                });
            } else {
                self.$container().html(html);
                self.onLoad([self, self.$container()]);
            }
        }

        function loadContent(url, hasEffect) {
            self._lasturl = url;
            if (!_getCache(url) || !config.cache) {
                $.ajax({
                    url: url
                    , data: { _avril_guid: avril.guid() }
                    , success: function (response) {
                        var isJSON = false, obj;
                        try {
                            var json = $('<div/>').html(response).text();
                            obj = eval('(' + json + ')');
                            isJSON = true;
                        }
                        catch (E) { }
                        if (isJSON) {
                            if (response.innerType) {
                                avril[response.innerType](response.msg, function () {
                                    avril.event.get('response.' + response.innerType)(avril.toArray(arguments).push(url));
                                });
                            } else {
                                avril.ui.msg().show('body>div.container.main-page', obj);
                            }
                        }
                        else {
                            cache[url] = response;
                            setContent(response, hasEffect);
                        }
                    }
                });
            } else if (config.cache && _getUrl(url)) {
                setContent(_getCache(url));
            }
        }

        this.loadContent = loadContent;

        this.onLoad = avril.event.get('onLoad', this);

        this.reload = function () {
            if (self._lasturl) {
                this.loadContent(self._lasturl, false);
            }
            return this;
        }

        this.beforeLoad = avril.event.get('beforeLoad', this);

        this.navTo = function (url) {
            if (this.options().enabled) {
                window.location = '#' + url;
                triggerChange = false;
                this.loadContent(url);
            }
        }

        this.parseLink = function (links) {
            $(links).each(function () {
                if (!$(this).data('ajaxframe-parse') && !$(this).is('.no-ajax')) {
                    $(this).click(function (e) {
                        if (self.options().enabled) {
                            e.preventDefault();
                            self.navTo($(this).attr('href'));
                        }
                    });
                    $(this).data('ajaxframe-parse', true)
                }
            });
        }

        this.init = function () {
            _firstContent = this.$container().html();
            $(window).hashchange(function () {
                if (self.options().enabled) {
                    if (triggerChange && _isAjaxHash()) {
                        self.loadContent(_getUrl());
                    } else if (triggerChange && !window.location.hash) {
                        setContent(_firstContent);
                    }
                }

                triggerChange = true;
            });
            if (_isAjaxHash() && self.options().enabled) {
                self.loadContent(_getUrl(), false);
            }
            this.parseLink('a.ajaxlink');
        }

        this.getUrl = function () {
            return _getUrl();
        }
    });

    window.ajaxFrame = avril.ui.ajaxframe();
})(jQuery, avril);
//#endregion

//#region avril.ui.getZindex 
(function () {
    avril.ui.getZindex = function () {
        return $('*')
            .toArray()
            .select(function (el) {
                var zIndex = $(el).css('z-index');
                if (zIndex && !isNaN(zIndex)) {
                    return parseInt(zIndex);
                }
                return 0;
            }).sort().pop();
    }
})();
//#endregion

//#region avril loading cover
(function ($) {

    avril.namespace('avril.ui.loadingCover');

    avril.ui.loadingCover.removeAll = avril.event.register('avril.ui.loadingCover.removeAll');

    avril.ui.loadingCover.hideAll = avril.event.register('avril.ui.loadingCover.hideAll');

    function loadingCover(options) {
        var handle = $(this);
        if (!handle.data('loadingCover')) {
            var divStr = '<div/>'
            , $cover = $(divStr).css({
                position: 'absolute'
            }).addClass('loading-cover')
            , $mask = $(divStr).addClass('mask').appendTo($cover)
            , $img = $(divStr).addClass('loading-img').appendTo($cover)
            , adjustAlwaysVisible = function () {
                var $win = $(window)
                    , winHeigth = $win.height()
                    , winWidth = $win.width();
                $img.css({
                    'top': '50%'
                     , 'position': 'fixed'
                });
            }
            , adjustCover = function () {
                $cover.css({
                    width: handle.width()
                    , height: handle.height()
                    , top: handle.offset().top
                    , left: handle.offset().left
                    , 'z-index': avril.ui.getZindex() + 1
                });
                $img.css({
                    'left': handle.width() / 2 - 16
                    , 'top': handle.height() / 2 - 16
                })
            }
            , api = {
                adjust: adjustCover
                , remove: function () {
                    $cover.remove();
                    handle.data('loadingCover', null);
                }
                , hide: function () {
                    $cover.hide();
                }
                , show: function () {
                    adjustCover();
                    $cover.show();
                }
                , cover: function () {
                    return $cover;
                }
            };
            avril.ui.loadingCover.removeAll(api.remove);
            avril.ui.loadingCover.hideAll(api.hide);
            $cover.appendTo('body');
            adjustCover();
            $(window).resize(function () {
                adjustCover();
            });
            if (handle.is('body')) {
                adjustAlwaysVisible();
            }
            handle.data('loadingCover', api);
        } else {
            handle.data('loadingCover').show();
        }
    }

    $.fn.loadingCover = function (option) {
        this.each(function () { loadingCover.call(this, option); });
        return this;
    }
    //cache the loading image
    $(function () {
        $('body').loadingCover();
        avril.ui.loadingCover.hideAll();
    });
})(jQuery);
//#endregion

avril.module.notify('avril.ui');