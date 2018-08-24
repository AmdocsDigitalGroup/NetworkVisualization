var paths = {
    userScripts: ['js/map.js', 'js/htmlUtils.js', 'js/topology-graph.js'],
    // popupScript: 'js/popupJS.js',
    vendorScript: ['node_modules/babel-polyfill/dist/polyfill.min.js',
        'bower_components/jquery/dist/jquery.min.js', 'bower_components/jquery-ui/jquery-ui.min.js',
        'bower_components/bootstrap/dist/js/bootstrap.min.js',
        'bower_components/d3/d3.min.js', 'bower_components/fetch-jsonp/build/fetch-jsonp.js',
        'bower_components/leaflet/dist/leaflet.js',
        'bower_components/leaflet-bing-layer/leaflet-bing-layer.min.js',
        'bower_components/Leaflet.D3SvgOverlay/L.D3SvgOverlay.js'],
    homePageCss: ['css/topology-graph.css', 'css/simple-sidebar.css'],
    popupCss:'css/popupStyle.css',
    loginCss: 'css/loginCss/*.css',
    vendorCss: ['bower_components/bootstrap/dist/css/bootstrap.min.css', 'bower_components/bootstrap/dist/css/bootstrap-theme.min.css',
        'bower_components/font-awesome/css/font-awesome.min.css', 'bower_components/leaflet/dist/leaflet.css']
};
var filesToMove = ['scratch/*.*',
    'input_data/*.json',
    'bower.json',
    'package.json',
    'index.html',
    'popup.html',
    'login.html',
    'Gruntfile.js'
];
var injectionFiles = {
    vendor_css: "gruntFolder/css/bower-style.min.css",
    login_css: "gruntFolder/css/login/login-style.min.css",
    user_css: "gruntFolder/css/style.min.css",
    popup_css: "gruntFolder/css/popupStyle.min.css",

    vendor_js: "gruntFolder/js/bower-script.min.js",
    input_js: "gruntFolder/js/input-script.min.js",
    user_js: "gruntFolder/js/user-script.min.js",
    popup_js: "gruntFolder/js/popupJS.min.js"
};

module.exports = function (grunt) {
    require('load-grunt-tasks')(grunt);
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        clean: {
            init: {
                src: 'gruntFolder/'
            },
            end: {
                src: ['gruntFolder/temp', 'gruntFolder/js/es6/', 'gruntFolder/js/input_data/']
            }
        },
        babel: {
            options: {
                sourceMap: false,
                presets: ['env']
            },
            dist: {
                files: [{
                    expand: true,
                    cwd: 'es6_JS/',
                    src: ['*.js'],
                    dest: 'gruntFolder/temp/js/es6/'
                }]
            },
            input_data: {
                files: [{
                    expand: true,
                    cwd: 'input_data/',
                    src: ['*.js'],
                    dest: 'gruntFolder/temp/js/input_data/'
                }]
            }
        },
        concat: {
            options: {
                separator: ';',
            },
            vendor_css: {
                src: paths.vendorCss,
                dest: 'gruntFolder/temp/css/bower-style.css',
            },
            user_css: {
                src: paths.homePageCss,
                dest: 'gruntFolder/temp/css/style.css',
            },
            login_css: {
                src: paths.loginCss,
                dest: 'gruntFolder/temp/css/login-style.css',
            },
            vendor_js: {
                src: paths.vendorScript,
                dest: 'gruntFolder/temp/js/bower-script.js',
            },
            user_js: {
                src: [paths.userScripts, 'gruntFolder/temp/js/es6/*.js'],
                dest: 'gruntFolder/temp/js/user-script.js',
            },
            input_js: {
                src: ['gruntFolder/temp/js/input_data/*.js'],
                dest: 'gruntFolder/temp/js/input-script.js',
            },
        },
        cssmin: {
            target: {
                files: [{
                    expand: true,
                    cwd: 'gruntFolder/temp/css',
                    src: ['*.css', '!*.min.css', '!login-style.css'],
                    dest: 'gruntFolder/css',
                    ext: '.min.css'
                }, {
                    expand: true,
                    cwd: 'css/',
                    src: 'popupStyle.css',
                    dest: 'gruntFolder/css',
                    ext: '.min.css'
                },{
                    expand: true,
                    cwd: 'gruntFolder/temp/css',
                    src: ['login-style.css', '!*.min.css'],
                    dest: 'gruntFolder/css/login/',
                    ext: '.min.css'
                }]
            }
        },
        uglify: {
            target: {
                files: [{
                    expand: true,
                    cwd: 'gruntFolder/temp/js/',
                    src: ['*.js'],
                    dest: 'gruntFolder/js',
                    ext: '.min.js'
                },{
                    expand: true,
                    cwd: 'js/',
                    src: ['popupJS.js'],
                    dest: 'gruntFolder/js',
                    ext: '.min.js'
                }]
            }
        },
        copy: {
            main: {
                expand: true,
                src: filesToMove,
                dest: 'gruntFolder/',
            },
        },
        injector: {
            options: {
                addRootSlash: false,
                relative: true
            },
            local_dependencies: {
                files: [
                    {
                        'gruntFolder/login.html': [injectionFiles.vendor_js, injectionFiles.user_js
                            , injectionFiles.vendor_css, injectionFiles.login_css]
                    }, {
                        'gruntFolder/index.html': [injectionFiles.vendor_js, injectionFiles.user_js, injectionFiles.input_js
                            , injectionFiles.vendor_css, injectionFiles.user_css]
                    },
                    {
                        'gruntFolder/popup.html': [injectionFiles.popup_js,injectionFiles.popup_css]
                    }
                ]
            }
        },
        image: {
            dynamic: {
                files: [{
                    expand: true,
                    cwd: 'resources/images/',
                    src: ['**/*.*'],
                    dest: 'gruntFolder/resources/images/'
                }]
            }
        },
        concurrent: {
            target: {
                tasks: [['clean:init', 'babel', 'sass', 'concat', 'cssmin', 'uglify', 'copy', 'injector', 'clean:end'/**, 'image'/**/]],
                options: {
                    logConcurrentOutput: true
                }
            }
        },
        sass: {
            options: {
                sourceMap: false
            },
            dist: {
                files: {
                    'css/topology-graph.css': 'css/topology-graph.scss',
                    'css/popupStyle.css': 'css/popupStyle.scss'
                }
            }
        }
    });
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-image');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-injector');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-concurrent');
    grunt.loadNpmTasks('grunt-sass');
    grunt.registerTask('default', ['concurrent:target']);
};