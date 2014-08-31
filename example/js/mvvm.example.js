/**
 * Created by trump on 14/6/26.
 */
(function(){
    $(function(){
        avril.Mvvm.defaults.show_dev_info = true;
        avril.mvvm.bindDom(document);

        avril.mvvm.subscribe('$root.model.obj.key1,$root.model.obj.key2', function(){
            this.values(function(key1,key2){
                avril.mvvm.setVal('$root.model.obj.key3',  key1 +' '+ key2);
            });
        });
    });
})();