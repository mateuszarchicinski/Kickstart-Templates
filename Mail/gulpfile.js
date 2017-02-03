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


// GULP TASKS
gulp.task('css', function () {

    $.util.log($.util.colors.green('CSS TASK RUNNING...'));

    return gulp.src(config.DIRECTORY.WORK_DIR + '/sass/main.scss')
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
        .pipe(gulp.dest(config.DIRECTORY.WORK_DIR + '/css/'))
        .pipe(browserSync.stream());

});


gulp.task('css:inline', function () {

    $.util.log($.util.colors.green('CSS INLINE TASK RUNNING...'));

    return gulp.src(config.DIRECTORY.WORK_DIR + '/*.html')
        .pipe($.plumber())
        .pipe($.inlineSource({
            rootpath: config.DIRECTORY.WORK_DIR
        }))
        .pipe($.inlineCss({
            preserveMediaQueries: true,
            applyTableAttributes: true
        }))
        .pipe(gulp.dest(config.DIRECTORY.DIST_DIR + '/'));

});


gulp.task('jade:pug', function() {
    
    $.util.log($.util.colors.green('JADE TO PUG TASK RUNNING...'));
    
    gulp.src(config.DIRECTORY.WORK_DIR + '/template/**/*.jade', {
            base: config.DIRECTORY.WORK_DIR
        })
        .pipe($.rename({
            extname: '.pug'
        }))
        .pipe(gulp.dest(config.DIRECTORY.WORK_DIR + '/'))
        .on('end', function(){
            del(config.DIRECTORY.WORK_DIR + '/template/**/*.jade')
        });
    
});


// To get a parameter after comand option
function getOption(option){
    var elem = process.argv.indexOf(option);
    
    return elem !== -1 ? process.argv[elem + 1] : false;
};


gulp.task('pug', function () {

    $.util.log($.util.colors.green('PUG TASK RUNNING...'));

    return gulp.src(config.DIRECTORY.WORK_DIR + '/template/*.pug')
        .pipe($.plumber())
        .pipe($.data(function(){
            var lang = !getOption('--lang') ? 'pl' : getOption('--lang');
        
            if(!getOption('--lang')){
                $.util.log($.util.colors.green('Default data object configuration [PL] passed to puge. To change that, add command arguments to gulp task ---> gulp [TASK NAME = puge / default / build / build:server] --lang [LANGUAGE = pl/en]. Before that, do not forget a specify translation in project.data.json file.'));
            }
            
            return data.lang[lang];
        }))
        .pipe($.pug({
            pretty: true,
            compileDebug: true
        }))
        .pipe(gulp.dest(config.DIRECTORY.WORK_DIR + '/'));

});


gulp.task('html', function () {

    $.util.log($.util.colors.green('HTML TASK RUNNING...'));
    
    return gulp.src(config.DIRECTORY.WORK_DIR + '/*.html')
        .pipe($.plumber())
        .pipe($.useref())
        .pipe($.if('*.css', $.cleanCss()))
        .pipe(gulp.dest(config.DIRECTORY.WORK_DIR + '/'));

});


gulp.task('html:hint', function () {

    $.util.log($.util.colors.cyan('HTML HINT TASK RUNNING...'));

    return gulp.src(config.DIRECTORY.WORK_DIR + '/*.html')
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

    return gulp.src(config.DIRECTORY.DIST_DIR + '/*.html')
        .pipe($.plumber())
        .pipe($.htmlmin({
            minifyCSS: true
        }))
        .pipe(gulp.dest(config.DIRECTORY.DIST_DIR + '/'));

});


gulp.task('server', function () {

    $.util.log($.util.colors.red('SERVER TASK RUNNING...'));

    return browserSync.init({
        server: config.DIRECTORY.WORK_DIR + '/'
    });

});


gulp.task('watch', function () {

    $.util.log($.util.colors.blue('WATCH TASK RUNNING...'));

    gulp.watch(config.DIRECTORY.WORK_DIR + '/sass/**/*.s+(a|c)ss', ['css']);
    gulp.watch(config.DIRECTORY.WORK_DIR + '/template/**/*.pug', ['pug']);
    gulp.watch(config.DIRECTORY.WORK_DIR + '/*.html', ['html:hint', browserSync.reload]);

});


gulp.task('clean', function () {

    $.util.log($.util.colors.gray('CLEAN TASK RUNNING...'));

    return del(config.DIRECTORY.DIST_DIR + '/');

});


gulp.task('copy', function () {

    $.util.log($.util.colors.grey('COPY TASK RUNNING...'));

    return gulp.src([config.DIRECTORY.WORK_DIR + '/files/**/*', config.DIRECTORY.WORK_DIR + '/img/**/*', config.DIRECTORY.WORK_DIR + '/*.png', config.DIRECTORY.WORK_DIR + '/*.ico'], {
            base: config.DIRECTORY.WORK_DIR
        })
        .pipe($.plumber())
        .pipe(gulp.dest(config.DIRECTORY.DIST_DIR + '/'));

});


gulp.task('images', function () {

    $.util.log($.util.colors.magenta('IMAGES TASK RUNNING...'));

    return gulp.src(config.DIRECTORY.DIST_DIR + '/img/**/*', {
            base: config.DIRECTORY.DIST_DIR
        })
        .pipe($.plumber())
        .pipe($.imagemin([
            imageminGifsicle(),
            imageminJpegtran(),
            imageminOptipng(),
            imageminSvgo()
        ]))
        .pipe(gulp.dest(config.DIRECTORY.DIST_DIR + '/'));

});


gulp.task('images:optimized', function () {

    $.util.log($.util.colors.magenta('IMAGES OPTIMIZED TASK RUNNING...'));
    
    if(!config.API_KEYS.TINIFY){
        return $.util.log($.util.colors.magenta('Task can not be complited. Rememeber to set up your TINIFY API KEY in project.config.js file.'));
    }

    return gulp.src(config.DIRECTORY.DIST_DIR + '/img/**/*', {
            base: config.DIRECTORY.DIST_DIR
        })
        .pipe($.tinify(config.API_KEYS.TINIFY))
        .pipe(gulp.dest(config.DIRECTORY.DIST_DIR + '/'));

});


gulp.task('upload', function () {

    $.util.log($.util.colors.yellow('UPLOAD TASK RUNNING...'));
    
    var ftpConfig = {
        host: config.FTP_CONFIG.HOST,
        user: config.FTP_CONFIG.USER,
        password: config.FTP_CONFIG.PASSWORD
    };
    
    if(!ftpConfig.host || !ftpConfig.user || !ftpConfig.password || !argv.upload){
        return $.util.log($.util.colors.yellow('Task can not be complited. Rememeber to set up your FTP CONFIG in project.config.js file. Then add command argument to gulp task ---> gulp [TASK NAME = upload / build / build:server] --upload.'));
    }

    var conn = ftp.create(ftpConfig);

    return gulp.src(config.DIRECTORY.DIST_DIR + '/**/*')
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
        server: config.DIRECTORY.DIST_DIR + '/'
    });

});


gulp.task('default', function (cb) {

    $.util.log($.util.colors.red('DEFAULT TASK RUNNING...'));

    runSequence('css', 'pug', 'html:hint', 'server', 'watch', cb);

});