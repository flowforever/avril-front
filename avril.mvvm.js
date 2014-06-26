/**
 * Created by trump.wang on 2014/6/26.
 */
;(function(av,$, win){
    avril.namespace('avril.mvvm');

    avril.createlib('avril.mvvm.TemplateParser',function(options){
        var cfg = $.extend(this.options(),{
                /* default config */
            } , options)
            , cache = {};

        this.parse = function(dom,controller){
            controller = controller || win;

        }
    });

})(avril,jQuery, window);
