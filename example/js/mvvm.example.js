/**
 * Created by trump on 14/6/26.
 */
(function($){
    avril.Mvvm.defaults.show_dev_info = true;

    var setCurrentMenu = function(){
        var paths = location.pathname.split('/');
        var currentPage = paths[ paths.length - 1 ];
        avril.mvvm.setVal('$root.routeInfo.currentPage', currentPage);
    };

    setCurrentMenu();

    avril.mvvm.setVal('$root.mainMenu',[
        { text: 'Home', url: 'index.html'  }
        , { text: 'Array', url: 'array.html'  }
    ]);

    $(function(){

        avril.mvvm.setVal('$root.basicEach',[{},{},{}])

        avril.mvvm.bindDom(document);
    });
})(jQuery);