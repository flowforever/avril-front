/**
 * Created by trump on 14/6/26.
 */
(function($){
    avril.config({
        moduleRoot: '/js/avril'
    });

    avril.Mvvm.defaults.show_dev_info = true;

    var setCurrentMenu = function(){
        var paths = location.pathname.split('/');
        var currentPage = paths[ paths.length - 1 ];
        avril.mvvm.setVal('$root.routeInfo.currentPage', currentPage);
    };

    var mvvm = avril.mvvm;

    mvvm.setVal('$root.mainMenu',[
        { text: 'Home', url: 'index.html'  }
        , { text: 'Array', url: 'array.html'  }
        , { text: 'Controller', url: 'controller.html'  }
        , { text: 'Test', url: '/avril-front/test/index.html'  }
    ]);


    var testRealArray = avril.array( new Array(10) ).select(function(item,index){
        return {
            name: 'name'+index
            , id: index
        }
    });

    mvvm.setVal('$root.avRealScope.array',testRealArray);

    mvvm.router.use(function(req, next) {
        // load controller


        //load data

    });

    mvvm.router.use('', function(req,next){

    });

    mvvm.router.add('home', '',function(){ });

    $(function(){

        setCurrentMenu();

        mvvm.setVal('$root.timeTest', new Array(20000));

        mvvm.setVal('$root.basicEach',[{},{},{}])

        mvvm.bindDom(document);
    });

})(jQuery);