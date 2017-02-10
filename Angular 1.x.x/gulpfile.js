'use strict';


// NODE MODULES
var gulp = require('gulp'),
    $ = require('gulp-load-plugins')({
        lazy: true
    }),
    jshintStylish = require('jshint-stylish'),
    htmlhintStylish = require('htmlhint-stylish'),
    wiredep = require('wiredep').stream,
    browserSync = require('browser-sync'),
    del = require('del'),
    imageminGifsicle = require('imagemin-gifsicle'),
    imageminJpegtran = require('imagemin-jpegtran'),
    imageminOptipng = require('imagemin-optipng'),
    imageminSvgo = require('imagemin-svgo'),
    ftp = require('vinyl-ftp'),
    runSequence = require('run-sequence'),
    fs = require('fs'),
    karma = require('karma').Server;


// PROJECT CONFIG
var PROJECT_CONFIG = require('./project.config');


// GULP TASKS
gulp.task('css', function () {

    $.util.log($.util.colors.green('CSS TASK RUNNING...'));

    return gulp.src(PROJECT_CONFIG.DIRECTORY.WORK_DIR + '/sass/main.scss')
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
        .pipe(gulp.dest(PROJECT_CONFIG.DIRECTORY.WORK_DIR + '/css/'))
        .pipe(browserSync.stream());

});


gulp.task('js:hint', function () {

    $.util.log($.util.colors.cyan('JS HINT TASK RUNNING...'));

    return gulp.src(PROJECT_CONFIG.DIRECTORY.WORK_DIR + '/js/**/*.js')
        .pipe($.plumber())
        .pipe($.jshint())
        .pipe($.jshint.reporter(jshintStylish));

});


gulp.task('js:test', function () {

    $.util.log($.util.colors.cyan('JS TEST TASK RUNNING...'));

    return new karma({
        configFile: __dirname + '/' + PROJECT_CONFIG.DIRECTORY.TEST_DIR + '/karma.conf.js'
        }).start();

});


gulp.task('jade:pug', function() {
    
    $.util.log($.util.colors.green('JADE TO PUG TASK RUNNING...'));
    
    gulp.src(PROJECT_CONFIG.DIRECTORY.WORK_DIR + '/template/**/*.jade', {
            base: PROJECT_CONFIG.DIRECTORY.WORK_DIR
        })
        .pipe($.rename({
            extname: '.pug'
        }))
        .pipe(gulp.dest(PROJECT_CONFIG.DIRECTORY.WORK_DIR + '/'))
        .on('end', function(){
            del(PROJECT_CONFIG.DIRECTORY.WORK_DIR + '/template/**/*.jade')
        });
    
});


// To get a parameter after comand option
function getOption(option){
    var index = process.argv.indexOf(option);
    
    return index !== -1 ? {
       value: process.argv[index + 1] 
    } : false;
};


gulp.task('pug', function () {

    $.util.log($.util.colors.green('PUG TASK RUNNING...'));

    if(!getOption('--lang').value){
        $.util.log($.util.colors.green('Default data object configuration [PL] passed to puge. To change that, add command arguments to gulp task ---> gulp [TASK NAME = puge / default / build / build:server] --lang [LANGUAGE = pl/en]. Before that, do not forget a specify translation in ' + PROJECT_CONFIG.DATA_FILE + ' file.'));
    }
    
    return gulp.src([PROJECT_CONFIG.DIRECTORY.WORK_DIR + '/template/*.pug', PROJECT_CONFIG.DIRECTORY.WORK_DIR + '/template/views/*.pug'], {
            base: './' + PROJECT_CONFIG.DIRECTORY.WORK_DIR + '/template'
        })
        .pipe($.plumber())
        .pipe($.data(function(){
            var value = getOption('--lang').value,
                lang = !value ? 'pl' : value;
            
            return {
                appName: PROJECT_CONFIG.APP_NAME,
                data: JSON.parse(fs.readFileSync('./' + PROJECT_CONFIG.DATA_FILE, 'utf8')).lang[lang]
            };
        }))
        .pipe($.pug({
            pretty: true,
            compileDebug: true
        }))
        .pipe(wiredep({
            exclude: ['animatewithsass', 'angular-mocks', 'bower_components/angular-material/angular-material.css'],
            ignorePath: '../'
        }))
        .pipe(gulp.dest(PROJECT_CONFIG.DIRECTORY.WORK_DIR + '/'));

});


gulp.task('html', function () {

    $.util.log($.util.colors.green('HTML TASK RUNNING...'));

    return gulp.src([PROJECT_CONFIG.DIRECTORY.WORK_DIR + '/*.html', PROJECT_CONFIG.DIRECTORY.WORK_DIR + '/views/*.html'], {
            base: PROJECT_CONFIG.DIRECTORY.WORK_DIR
        })
        .pipe($.plumber())
        .pipe($.useref())
        .pipe($.if('*.css', $.cleanCss()))
        .pipe($.if('*.js', $.uglify()))
        .pipe(gulp.dest(PROJECT_CONFIG.DIRECTORY.DIST_DIR + '/'));

});


gulp.task('html:hint', function () {

    $.util.log($.util.colors.cyan('HTML HINT TASK RUNNING...'));

    return gulp.src([PROJECT_CONFIG.DIRECTORY.WORK_DIR + '/*.html', PROJECT_CONFIG.DIRECTORY.WORK_DIR + '/views/*.html'])
        .pipe($.plumber())
        .pipe($.htmlhint({
            'tagname-lowercase': true,
            'attr-lowercase': true,
            'attr-value-double-quotes': true,
            'attr-no-duplication': true,
            'doctype-first': false, // true
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

    return gulp.src([PROJECT_CONFIG.DIRECTORY.DIST_DIR + '/*.html', PROJECT_CONFIG.DIRECTORY.DIST_DIR + '/views/*.html'], {
            base: PROJECT_CONFIG.DIRECTORY.DIST_DIR
        })
        .pipe($.plumber())
        .pipe($.htmlmin({
            minifyCSS: true
        }))
        .pipe(gulp.dest(PROJECT_CONFIG.DIRECTORY.DIST_DIR + '/'));

});


gulp.task('server', function () {

    $.util.log($.util.colors.red('SERVER TASK RUNNING...'));

    return browserSync.init({
        server: PROJECT_CONFIG.DIRECTORY.WORK_DIR + '/'
    });

});


gulp.task('watch', function () {

    $.util.log($.util.colors.blue('WATCH TASK RUNNING...'));

    gulp.watch(PROJECT_CONFIG.DIRECTORY.WORK_DIR + '/sass/**/*.s+(a|c)ss', ['css']);
    gulp.watch(PROJECT_CONFIG.DIRECTORY.WORK_DIR + '/js/**/*.js', ['js:hint', browserSync.reload]);
    gulp.watch([PROJECT_CONFIG.DATA_FILE, PROJECT_CONFIG.DIRECTORY.WORK_DIR + '/template/**/*.pug'], ['pug']);
    gulp.watch([PROJECT_CONFIG.DIRECTORY.WORK_DIR + '/*.html', PROJECT_CONFIG.DIRECTORY.WORK_DIR + '/views/*.html'], ['html:hint', browserSync.reload]);

});


gulp.task('clean', function () {

    $.util.log($.util.colors.gray('CLEAN TASK RUNNING...'));

    return del(PROJECT_CONFIG.DIRECTORY.DIST_DIR + '/');

});


gulp.task('copy', function () {

    $.util.log($.util.colors.grey('COPY TASK RUNNING...'));

    return gulp.src([PROJECT_CONFIG.DIRECTORY.WORK_DIR + '/files/**/*', PROJECT_CONFIG.DIRECTORY.WORK_DIR + '/fonts/**/*', PROJECT_CONFIG.DIRECTORY.WORK_DIR + '/img/**/*', PROJECT_CONFIG.DIRECTORY.WORK_DIR + '/*.png', PROJECT_CONFIG.DIRECTORY.WORK_DIR + '/*.xml', PROJECT_CONFIG.DIRECTORY.WORK_DIR + '/*.ico'], {
            base: PROJECT_CONFIG.DIRECTORY.WORK_DIR
        })
        .pipe($.plumber())
        .pipe(gulp.dest(PROJECT_CONFIG.DIRECTORY.DIST_DIR + '/'));

});


gulp.task('images', function () {

    $.util.log($.util.colors.magenta('IMAGES TASK RUNNING...'));

    return gulp.src(PROJECT_CONFIG.DIRECTORY.DIST_DIR + '/img/**/*', {
            base: PROJECT_CONFIG.DIRECTORY.DIST_DIR
        })
        .pipe($.plumber())
        .pipe($.imagemin([
            imageminGifsicle(),
            imageminJpegtran(),
            imageminOptipng(),
            imageminSvgo()
        ]))
        .pipe(gulp.dest(PROJECT_CONFIG.DIRECTORY.DIST_DIR + '/'));

});


gulp.task('images:optimized', function () {

    $.util.log($.util.colors.magenta('IMAGES OPTIMIZED TASK RUNNING...'));
    
    if(!PROJECT_CONFIG.API_KEYS.TINIFY){
        return $.util.log($.util.colors.magenta('Task can not be complited. Rememeber to set up your TINIFY API KEY in ' + PROJECT_CONFIG.CONFIG_FILE + ' file.'));
    }

    return gulp.src(PROJECT_CONFIG.DIRECTORY.DIST_DIR + '/img/**/*', {
            base: PROJECT_CONFIG.DIRECTORY.DIST_DIR
        })
        .pipe($.tinify(PROJECT_CONFIG.API_KEYS.TINIFY))
        .pipe(gulp.dest(PROJECT_CONFIG.DIRECTORY.DIST_DIR + '/'));

});


gulp.task('images:sprite', function () {

    $.util.log($.util.colors.magenta('IMAGES SPRITE TASK RUNNING...'));
    
    var name = getOption('--name').value,
        spriteCssName = !name ? '_sprite' : name,
        spriteImgName = spriteCssName[0] === '_' ? spriteCssName.substring(1) : spriteCssName;
    
    return gulp.src(PROJECT_CONFIG.DIRECTORY.WORK_DIR + '/img/sprites_sources/**/*.{jpg,png,gif}')
        .pipe($.spritesmith({
            imgName: spriteImgName + '.png',
            cssName: spriteCssName + '.scss',
            imgPath: '../img/' + spriteImgName + '.png'
        }))
        .pipe($.if('*.png', gulp.dest(PROJECT_CONFIG.DIRECTORY.WORK_DIR + '/img/'), gulp.dest(PROJECT_CONFIG.DIRECTORY.WORK_DIR + '/sass/components/sprites/')));

});


gulp.task('upload', function () {

    $.util.log($.util.colors.yellow('UPLOAD TASK RUNNING...'));
    
    var ftpConfig = {
        host: PROJECT_CONFIG.FTP_CONFIG.HOST,
        user: PROJECT_CONFIG.FTP_CONFIG.USER,
        password: PROJECT_CONFIG.FTP_CONFIG.PASSWORD
    };
    
    if(!ftpConfig.host || !ftpConfig.user || !ftpConfig.password || !getOption('--upload')){
        return $.util.log($.util.colors.yellow('Task can not be complited. Rememeber to set up your FTP CONFIG in ' + PROJECT_CONFIG.CONFIG_FILE + ' file. Then add command argument to gulp task ---> gulp [TASK NAME = upload / build / build:server] --upload.'));
    }

    var conn = ftp.create(ftpConfig);

    return gulp.src(PROJECT_CONFIG.DIRECTORY.DIST_DIR + '/**/*')
        .pipe($.plumber())
        .pipe(conn.dest('/public_html/'));

});


gulp.task('build', function (cb) {

    $.util.log($.util.colors.red('BUILD TASK RUNNING...'));

    runSequence('clean', 'css', 'js:hint', 'pug', 'html:hint', 'html', 'html:minify', 'copy', 'upload', cb);

});


gulp.task('build:server', ['build'], function () {

    $.util.log($.util.colors.red('BUILD SERVER TASK RUNNING...'));

    browserSync.init({
        server: PROJECT_CONFIG.DIRECTORY.DIST_DIR + '/'
    });

});


gulp.task('default', function (cb) {

    $.util.log($.util.colors.red('DEFAULT TASK RUNNING...'));

    runSequence('css', 'js:hint', 'pug', 'html:hint', 'server', 'watch', cb);

});