'use strict';


// DIRECTORY CONFIG
var work_Dir = 'src',
    dist_Dir = 'dist';


// NODE MODULES
var gulp = require('gulp'),
    $ = require('gulp-load-plugins')({
        lazy: true
    }),
    jshintStylish = require('jshint-stylish'),
    htmlhintStylish = require('htmlhint-stylish'),
    browserSync = require('browser-sync'),
    del = require('del'),
    imageminGifsicle = require('imagemin-gifsicle'),
    imageminJpegtran = require('imagemin-jpegtran'),
    imageminOptipng = require('imagemin-optipng'),
    imageminSvgo = require('imagemin-svgo'),
    ftp = require('vinyl-ftp'),
    argv = require('yargs').argv,
    runSequence = require("run-sequence");


// GULP TASKS
gulp.task('css', function () {

    $.util.log($.util.colors.green('CSS TASK RUNNING...'));

    return gulp.src(work_Dir + '/sass/main.scss')
        .pipe($.plumber())
        .pipe($.sourcemaps.init())
        .pipe($.sassLint({
            options: {
                'formatter': 'stylish',
                'merge-default-rules': false
            },
            rules: {
                'extends-before-mixins': 2,
                'extends-before-declarations': 2,
                'placeholder-in-extend': 2,
                'mixins-before-declarations': 2,
                'no-color-literals': 2,
                'no-warn': 1,
                'no-debug': 1,
                'no-ids': 2,
                'no-important': 2,
                'hex-notation': 2,
                'indentation': 0,
                'property-sort-order': 1,
                'variable-for-property': 2
            }
        }))
        .pipe($.sassLint.format())
        .pipe($.sass.sync({
            outputStyle: 'nested' // compact - compressed - expanded - nested
        }))
        .pipe($.autoprefixer({
            browsers: ['last 5 version'],
            cascade: false,
            stats: ['> 1%']
        }))
        .pipe($.sourcemaps.write('./maps'))
        .pipe(gulp.dest(work_Dir + '/css/'))
        .pipe(browserSync.stream());

});


gulp.task('js', function () {

    $.util.log($.util.colors.cyan('JS TASK RUNNING...'));

    return gulp.src(work_Dir + '/js/**/*.js')
        .pipe($.plumber())
        .pipe($.jshint())
        .pipe($.jshint.reporter(jshintStylish));

});


gulp.task('jade', function () {

    $.util.log($.util.colors.green('JADE TASK RUNNING...'));

    return gulp.src(work_Dir + '/template/*.jade')
        .pipe($.plumber())
        .pipe($.jade({
            pretty: true,
            compileDebug: true
        }))
        .pipe(gulp.dest(work_Dir + '/'));

});


gulp.task('html', function () {

    $.util.log($.util.colors.green('HTML TASK RUNNING...'));

    return gulp.src(work_Dir + '/*.html')
        .pipe($.plumber())
        .pipe($.useref())
        .pipe($.if('*.css', $.cleanCss()))
        .pipe($.if('*.js', $.uglify()))
        .pipe(gulp.dest(dist_Dir + '/'));

});


gulp.task('html:hint', function () {

    $.util.log($.util.colors.cyan('HTML HINT TASK RUNNING...'));

    return gulp.src(work_Dir + '/*.html')
        .pipe($.plumber())
        .pipe($.htmlhint({
            'tagname-lowercase': true,
            'attr-lowercase': true,
            'attr-value-double-quotes': true,
            'attr-no-duplication': true,
            'doctype-first': true,
            'tag-pair': true,
            'tag-self-close': false,
            'spec-char-escape': false,
            'id-unique': true,
            'src-not-empty': true,
            'title-require': true
        }))
        .pipe($.htmlhint.reporter(htmlhintStylish));

});

gulp.task('html:minify', function () {

    $.util.log($.util.colors.green('HTML MINIFY TASK RUNNING...'));

    return gulp.src(dist_Dir + '/*.html')
        .pipe($.plumber())
        .pipe($.htmlmin())
        .pipe(gulp.dest(dist_Dir + '/'));

});


gulp.task('server', function () {

    $.util.log($.util.colors.red('SERVER TASK RUNNING...'));

    return browserSync.init({
        server: work_Dir + '/'
    });

});


gulp.task('watch', function () {

    $.util.log($.util.colors.blue('WATCH TASK RUNNING...'));

    gulp.watch(work_Dir + '/sass/**/*.s+(a|c)ss', ['css']);
    gulp.watch(work_Dir + '/js/**/*.js', ['js', browserSync.reload]);
    gulp.watch(work_Dir + '/template/*.jade', ['jade']);
    gulp.watch(work_Dir + '/*.html', ['html:hint', browserSync.reload]);

});


gulp.task('clean', function () {

    $.util.log($.util.colors.gray('CLEAN TASK RUNNING...'));

    return del(dist_Dir + '/');

});


gulp.task('copy', function () {

    $.util.log($.util.colors.grey('COPY TASK RUNNING...'));

    return gulp.src([work_Dir + '/files/*', work_Dir + '/fonts/*', work_Dir + '/img/*', work_Dir + '/*.png', work_Dir + '/*.xml', work_Dir + '/*.ico'], {
            base: work_Dir
        })
        .pipe($.plumber())
        .pipe(gulp.dest(dist_Dir + '/'));

});


gulp.task('images', function () {

    $.util.log($.util.colors.magenta('IMAGES TASK RUNNING...'));

    return gulp.src(dist_Dir + '/img/**/*', {
            base: dist_Dir
        })
        .pipe($.plumber())
        .pipe($.imagemin([
            imageminGifsicle(),
            imageminJpegtran(),
            imageminOptipng(),
            imageminSvgo()
        ]))
        .pipe(gulp.dest(dist_Dir + '/'));

});


gulp.task('upload', function () {

    $.util.log($.util.colors.yellow('UPLOAD TASK RUNNING...'));

    var conn = ftp.create({
        host: '',
        user: '',
        password: ''
    });

    return gulp.src(dist_Dir + '/**/*')
        .pipe($.plumber())
        .pipe($.if(argv.upload, conn.dest('/public_html/')));

});


gulp.task('build', function (cb) {

    $.util.log($.util.colors.red('BUILD TASK RUNNING...'));

    runSequence('clean', 'css', 'js', 'jade', 'html:hint', 'html', 'copy', 'images', 'upload', cb);

});


gulp.task("build:server", ["build"], function () {

    $.util.log($.util.colors.red('BUILD SERVER TASK RUNNING...'));

    browserSync.init({
        server: dist_Dir + '/'
    });

});


gulp.task('default', function (cb) {

    $.util.log($.util.colors.red('DEFAULT TASK RUNNING...'));

    runSequence('css', 'js', 'jade', 'html:hint', 'server', 'watch', cb);

});