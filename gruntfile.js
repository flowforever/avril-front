/**
 * Created by trump.wang on 2014/8/13.
 */
module.exports = function(grunt){

    var gruntConfig = {};

    try{
        gruntConfig = require("./config.json") ;
    }catch (E){

    }

    var allJsFileArr = [
        'avril.js'
        , 'avril.tools.js'
        , 'avril.validator.js'
        , 'avril.ui.js'
        , 'avril.mvc.js'
        , 'avril.mvc.viewHelper.js'
    ];

    var pkg = require('./package.json');

    var dynamicUglyFiles = {
        'avril-release/avril.all.latest.min.js': ['avril-release/avril.all.latest.js']
    };

    dynamicUglyFiles[ 'avril-release/avril.all-'+ pkg.version +'.min.js' ] = ['avril-release/avril.all-<%=pkg.version%>.js'];

    grunt.initConfig({
        pkg: pkg
        , concat:{
            all:{
                src: allJsFileArr
                , dest: 'avril-release/avril.all.latest.js'
            }
            , production: {
                src: allJsFileArr,
                dest: 'avril-release/avril.all-<%=pkg.version%>.js'
            }
        }
        , uglify: {
            options: {
                banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
                    '<%= grunt.template.today("yyyy-mm-dd") %> */\r\n'
            },
            avril_min: {
                files: dynamicUglyFiles
            }
        }
        , watch: {
            scripts: {
                files: ['avril*.js'],
                tasks: ['default'],
                options: {
                    spawn: false
                }
            }
        }
        , copy: gruntConfig.copy
        , clean:[
            'avril-release'
        ]
    });

    grunt.loadNpmTasks('grunt-contrib-clean');

    grunt.loadNpmTasks('grunt-contrib-concat');

    grunt.loadNpmTasks('grunt-contrib-uglify');

    grunt.loadNpmTasks('grunt-contrib-copy');

    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.event.on('watch', function(action, filepath, target) {
        grunt.log.writeln(target + ': ' + filepath + ' has ' + action);
    });

    grunt.registerTask('default' , ['clean', 'concat', 'uglify', "copy", 'watch' ] );

};