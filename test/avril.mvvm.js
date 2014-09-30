/**
 * Created by trump.wang on 2014/6/27.
 */

(function(){
    var rootModel = {
        basicArray: function(){
            var res = [];
            for(var i=0;i<10;i++){
                res.push({ i: i, name:'name' + i , guid: avril.guid() })
            }
            return res;
        }()
    };

    avril.mvvm.setVal('$root', rootModel);

})();
