const gulp = require('gulp');
const cleanCss = require('gulp-clean-css');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const clean = require('gulp-clean');
const inject = require('gulp-inject');
const babel = require('gulp-babel');
const deletefile = require('gulp-delete-file');
const runSequence = require('run-sequence').use(gulp);
const autoprefixer = require('gulp-autoprefixer');
const imagemin = require('gulp-imagemin');
const autopolyfiller = require('gulp-autopolyfiller');
const merge = require('event-stream').merge;
const order = require("gulp-order");
const htmlmin = require('gulp-htmlmin');
const access = require('gulp-accessibility');

var sass = require('gulp-sass');



var paths = {
    userScripts: ['js/*.js', 'prod/*.js'],
    vendorScript: ['node_modules/babel-polyfill/dist/polyfill.min.js',
        'bower_components/jquery/dist/jquery.min.js',
        'bower_components/jquery-ui/jquery-ui.min.js', 'bower_components/bootstrap/dist/js/bootstrap.min.js',
        'bower_components/d3/d3.min.js','bower_components/fetch-jsonp/build/fetch-jsonp.js',
         "bower_components/leaflet/dist/leaflet.js",
         "bower_components/leaflet-bing-layer/leaflet-bing-layer.min.js",
         "bower_components/Leaflet.D3SvgOverlay/L.D3SvgOverlay.js",
        "bower_components/fetch-jsonp/build/fetch-jsonp.js"],
     homePageCss: ['css/topology-graph.css', 'css/simple-sidebar.css'],
    loginCss: 'css/loginCss/*.css',
    vendorCss: ['bower_components/bootstrap/dist/css/bootstrap.min.css', 'bower_components/bootstrap/dist/css/bootstrap-theme.min.css',
        'bower_components/font-awesome/css/font-awesome.min.css', 'bower_components/leaflet/dist/leaflet.css']
};
var filesToMove = ['./scratch/*.*',
    './input_data/*.json',
    'popup.html',
    'bower.json',
    'package.json'
];

gulp.task('sass', function () {
    return gulp.src('css/*.scss')
      .pipe(sass().on('error', sass.logError))
      .pipe(gulp.dest('css'));
  });

gulp.task('clean', function () {
    return gulp.src('prod', { read: false })
        .pipe(clean());
});
gulp.task('deletefile', function () {
    var regexp = /\w*(\-\w{8}\.js){1}$|\w*(\-\w{8}\.css){1}$/;
    gulp.src(['prod/*.js'])
        .pipe(deletefile({ reg: regexp, deleteMatch: false }))
});
gulp.task('es-minify', function () {
    return gulp.src('es6_JS/*.js')
        .pipe(babel({ presets: ['es2015'] }))
        .pipe(gulp.dest('prod'));
});
gulp.task('input-minify', function () {
    return gulp.src('input_data/*.js')
        .pipe(babel({ presets: ['es2015'] }))
        .pipe(concat('input-script.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('prod/js/'));
});
gulp.task('login-css-minify', function () {
    return gulp.src(paths.loginCss)
        .pipe(concat('login-style.min.css'))
        .pipe(cleanCss({ compatibility: 'ie8' }))
        .pipe(gulp.dest('prod/css/login/'));
});
gulp.task('css-minify', function () {
    return gulp.src(paths.homePageCss)
        .pipe(autoprefixer({
            browsers: ['last 2 versions'],
            cascade: false
        }))
        .pipe(concat('style.min.css'))
        .pipe(cleanCss({ compatibility: 'firefox' }))
        .pipe(gulp.dest('prod/css/'));
});
gulp.task('vendor-css-minify', function () {
    return gulp.src(paths.vendorCss)
        .pipe(autoprefixer({
            browsers: ['last 2 versions'],
            cascade: false
        }))
        .pipe(concat('bower-style.min.css'))
        .pipe(gulp.dest('prod/css/'));
});

gulp.task('vendor-js-minify', function () {
    var all = gulp.src(paths.vendorScript)
        .pipe(concat('bower-script.min.js'));
    var polyfills = all
        .pipe(autopolyfiller('polyfills.js', {
            browsers: ['last 2 version', 'ie 8', 'ie 9']
        }));
    return merge(polyfills, all)
        // Order files. NB! polyfills MUST be first 
        .pipe(order([
            'polyfills.js',
            'bower-script.min.js'
        ]))
        //.pipe(concat('all.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('prod/js/'));
});
gulp.task('js-minify', ['es-minify'], function () {
    return gulp.src(paths.userScripts)
        .pipe(concat('user-script.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('prod/js/'));
});

gulp.task('login', function () {
    var target = gulp.src('login.html');
    var sources = gulp.src(['./prod/js/*.js', './prod/css/bower-style.min.css', './prod/css/login/*.css'], { read: true });

    return target.pipe(inject(sources, { ignorePath: '/prod' }))
        .pipe(gulp.dest('prod/'));
});

gulp.task('index', function () {
    var target = gulp.src('index.html');
    var sources = gulp.src(['./prod/js/*.js', './prod/css/*.css'], { read: false });

    return target.pipe(inject(sources, { ignorePath: '/prod' }))
        .pipe(gulp.dest('prod/'));
});
gulp.task('html-minify', function () {
    return gulp.src('./prod/*.html')
        .pipe(htmlmin({ collapseWhitespace: true, html5: true }))
        .pipe(gulp.dest('prod'));
});
gulp.task('move', function () {
    gulp.src(filesToMove, { base: './' }).pipe(gulp.dest('prod/'))
});

gulp.task('imagecompress', (callback) =>
    runSequence(['bg', 'ic', 'lo', 'pp'],
        callback)
);
gulp.task('bg', () =>
    gulp.src('resources/images/backgrounds/*')
        .pipe(imagemin([imagemin.gifsicle(),
        imagemin.jpegtran(),
        imagemin.optipng(),
        imagemin.svgo({ plugins: [{ cleanupIDs: false }] })]))
        .pipe(gulp.dest('prod/resources/images/backgrounds/'))
);
gulp.task('ic', () =>
    gulp.src('resources/images/icons/*')
        .pipe(imagemin([imagemin.gifsicle(),
        imagemin.jpegtran(),
        imagemin.optipng(),
        imagemin.svgo({ plugins: [{ cleanupIDs: false }] })]))
        .pipe(gulp.dest('prod/resources/images/icons/'))
);
gulp.task('lo', () =>
    gulp.src('resources/images/login/*')
        .pipe(imagemin([imagemin.gifsicle(),
        imagemin.jpegtran(),
        imagemin.optipng(),
        imagemin.svgo({ plugins: [{ cleanupIDs: false }] })]))
        .pipe(gulp.dest('prod/resources/images/login'))
);
gulp.task('pp', () =>
    gulp.src('resources/images/pop-ups/*')
        .pipe(imagemin([imagemin.gifsicle(),
        imagemin.jpegtran(),
        imagemin.optipng(),
        imagemin.svgo({ plugins: [{ cleanupIDs: false }] })]))
        .pipe(gulp.dest('prod/resources/images/pop-ups/'))
);
gulp.task('testAccessibility', function () {
    return gulp.src('./*.html')
        .pipe(access({
            force: true
        }))
        .on('error', console.log)
        .pipe(access.report({ reportType: 'txt' }))
        // .pipe(rename({
        //     extname: '.txt'
        // }))
        .pipe(gulp.dest('prod/reports/'));
});
gulp.task('build', function (callback) {
    runSequence('clean',
        ['css-minify', 'vendor-css-minify', 'login-css-minify'],
        ['vendor-js-minify', 'js-minify', 'input-minify'],
        ['login', 'index', 'deletefile', 'move', 'imagecompress'],
        'html-minify',
        callback);
});
gulp.task('update-for-test', function (callback) {
    runSequence(['css-minify', 'login-css-minify'],
        ['js-minify', 'input-minify'],
        ['login', 'index', 'deletefile', 'move'], 'html-minify',
        callback);
});
gulp.task('default', ['build']);