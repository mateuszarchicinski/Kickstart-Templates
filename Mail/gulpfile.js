'use strict';


// NODE MODULES
var gulp = require('gulp'),
    $ = require('gulp-load-plugins')({
        lazy: true
    }),
    htmlhintStylish = require('htmlhint-stylish'),
    browserSync = require('browser-sync'),
    del = require('del'),
    imageminGifsicle = require('imagemin-gifsicle'),
    imageminJpegtran = require('imagemin-jpegtran'),
    imageminOptipng = require('imagemin-optipng'),
    imageminSvgo = require('imagemin-svgo'),
    ftp = require('vinyl-ftp'),
    argv = require('yargs').argv,
    runSequence = require('run-sequence'),
    fs = require('fs');


// PROJECT CONFIG
var config = require('./project.config');


// PROJECT DATA
var data = JSON.parse(fs.readFileSync('./project.data.json', 'utf8'));


// DIRECTORY CONFIG
var work_Dir = config.DIRECTORY.WORK_DIR,
    dist_Dir = config.DIRECTORY.DIST_DIR;


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


gulp.task('css:inline', function () {

    $.util.log($.util.colors.green('CSS INLINE TASK RUNNING...'));

    return gulp.src(work_Dir + '/*.html')
        .pipe($.plumber())
        .pipe($.inlineSource({
            rootpath: work_Dir
        }))
        .pipe($.inlineCss({
            preserveMediaQueries: true,
            applyTableAttributes: true
        }))
        .pipe(gulp.dest(dist_Dir + '/'));

});


gulp.task('jade:pug', function() {
    
    $.util.log($.util.colors.green('JADE TO PUG TASK RUNNING...'));
    
    gulp.src(work_Dir + '/template/**/*.jade', {
            base: work_Dir
        })
        .pipe($.rename({
            extname: '.pug'
        }))
        .pipe(gulp.dest(work_Dir + '/'))
        .on('end', function(){
            del(work_Dir + '/template/**/*.jade')
        });
    
});


// To get a parameter after comand option
function getOption(option){
    var elem = process.argv.indexOf(option);
    
    return elem !== -1 ? process.argv[elem + 1] : false;
};


gulp.task('pug', function () {

    $.util.log($.util.colors.green('PUG TASK RUNNING...'));

    return gulp.src(work_Dir + '/template/*.pug')
        .pipe($.plumber())
        .pipe($.data(function(){
            var lang = !getOption('--lang') ? 'pl' : getOption('--lang');
            
            return data.lang[lang];
        }))
        .pipe($.pug({
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
        .pipe(gulp.dest(work_Dir + '/'));

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
        .pipe($.htmlmin({
            minifyCSS: true
        }))
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
    gulp.watch(work_Dir + '/template/**/*.pug', ['pug']);
    gulp.watch(work_Dir + '/*.html', ['html:hint', browserSync.reload]);

});


gulp.task('clean', function () {

    $.util.log($.util.colors.gray('CLEAN TASK RUNNING...'));

    return del(dist_Dir + '/');

});


gulp.task('copy', function () {

    $.util.log($.util.colors.grey('COPY TASK RUNNING...'));

    return gulp.src([work_Dir + '/files/**/*', work_Dir + '/img/**/*', work_Dir + '/*.png', work_Dir + '/*.ico'], {
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


gulp.task('images:optimized', function () {

    $.util.log($.util.colors.magenta('IMAGES OPTIMIZED TASK RUNNING...'));
    
    if(!config.API_KEYS.TINIFY){
        return $.util.log($.util.colors.magenta('Task can not be complited. Rememeber to set up your TINIFY API KEY in project.config.js file.'));
    }

    return gulp.src(dist_Dir + '/img/**/*', {
            base: dist_Dir
        })
        .pipe($.tinify(config.API_KEYS.TINIFY))
        .pipe(gulp.dest(dist_Dir + '/'));

});


gulp.task('upload', function () {

    $.util.log($.util.colors.yellow('UPLOAD TASK RUNNING...'));
    
    var ftpConfig = {
        host: config.FTP_CONFIG.HOST,
        user: config.FTP_CONFIG.USER,
        password: config.FTP_CONFIG.PASSWORD
    };
    
    if(!ftpConfig.host || !ftpConfig.user || !ftpConfig.password){
        return $.util.log($.util.colors.yellow('Task can not be complited. Rememeber to set up your FTP CONFIG in project.config.js file.'));
    }

    var conn = ftp.create(ftpConfig);

    return gulp.src(dist_Dir + '/**/*')
        .pipe($.plumber())
        .pipe($.if(argv.upload, conn.dest('/public_html/')));

});


gulp.task('build', function (cb) {

    $.util.log($.util.colors.red('BUILD TASK RUNNING...'));

    runSequence('clean', 'css', 'pug', 'html:hint', 'html', 'css:inline', 'html:minify', 'copy', 'upload', cb);

});


gulp.task('build:server', ['build'], function () {

    $.util.log($.util.colors.red('BUILD SERVER TASK RUNNING...'));

    browserSync.init({
        server: dist_Dir + '/'
    });

});


gulp.task('default', function (cb) {

    $.util.log($.util.colors.red('DEFAULT TASK RUNNING...'));

    runSequence('css', 'pug', 'html:hint', 'server', 'watch', cb);

});