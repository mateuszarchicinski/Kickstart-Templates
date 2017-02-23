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


// FUNCTIONS
// To get a parameter after comand option
function getOption(option){
    var index = process.argv.indexOf(option);
    
    return index !== -1 ? {
       value: process.argv[index + 1] 
    } : false;
};


// GULP TASKS
// Compiling SASS to CSS, adding right prefixes to CSS methods - depending on configuration, creating source map, finally injecting CSS styles into browser
gulp.task('sass:css', function () {

    $.util.log($.util.colors.green('SASS TO CSS TASK RUNNING...')); // https://www.npmjs.com/package/gulp-util

    return gulp.src(PROJECT_CONFIG.DIRECTORY.WORK_DIR + '/sass/main.s+(a|c)ss')
        .pipe($.plumber()) // https://www.npmjs.com/package/gulp-plumber
        .pipe($.sourcemaps.init()) // https://www.npmjs.com/package/gulp-sourcemaps
        .pipe($.sass.sync({ // https://github.com/sass/node-sass#options
            outputStyle: 'nested' // compact - compressed - expanded - nested
        }))
        .pipe($.autoprefixer({ // https://github.com/postcss/autoprefixer#options
            browsers: ['last 5 version'],
            cascade: false,
            stats: ['> 1%']
        }))
        .pipe($.sourcemaps.write('./maps'))
        .pipe(gulp.dest(PROJECT_CONFIG.DIRECTORY.WORK_DIR + '/css/'))
        .pipe(browserSync.stream({match: '**/*.css'})); // https://www.browsersync.io/docs/gulp

});


// Validate Syntactically Awesome Style Sheets (SASS) Code, atm custom configuration for more info / rules check ---> https://github.com/sasstools/sass-lint#configuring
gulp.task('sass:lint', function () {

    $.util.log($.util.colors.cyan('SASS LINT TASK RUNNING...'));

    return gulp.src(PROJECT_CONFIG.DIRECTORY.WORK_DIR + '/sass/**/*.s+(a|c)ss')
        .pipe($.plumber())
        .pipe($.sassLint({
            options: {
                'formatter': 'stylish', // checkstyle / stylish
                'merge-default-rules': false
            },
            rules: {
                'no-color-keywords': 2,
                'no-color-literals': 2,
                'no-ids': 2,
                'no-important': 2,
                'no-invalid-hex': 2,
                'hex-notation': 2
            }
        }))
        .pipe($.sassLint.format()); // https://github.com/sasstools/sass-lint/blob/master/docs/options/formatter.md

});


// Validate JavaScript Code, atm default configuration for more info check ---> http://jshint.com/docs/
gulp.task('js:hint', function () {

    $.util.log($.util.colors.cyan('JS HINT TASK RUNNING...'));

    return gulp.src(PROJECT_CONFIG.DIRECTORY.WORK_DIR + '/js/**/*.js')
        .pipe($.plumber())
        .pipe($.jshint())
        .pipe($.jshint.reporter(jshintStylish)); // https://github.com/spalger/gulp-jshint#reporters

});


// Runs unit tests in Karma environment which is configurable via karma.conf.js
gulp.task('js:test', function () {

    $.util.log($.util.colors.cyan('JS TEST TASK RUNNING...'));

    return new karma({
        configFile: __dirname + '/' + PROJECT_CONFIG.DIRECTORY.TEST_DIR + '/karma.conf.js' // https://karma-runner.github.io/1.0/config/configuration-file.html
        }).start();

});


// Changing extensions of files from .jade to .pug, finally removes all .jade files
gulp.task('jade:pug', function() {
    
    $.util.log($.util.colors.green('JADE TO PUG TASK RUNNING...'));
    
    gulp.src(PROJECT_CONFIG.DIRECTORY.WORK_DIR + '/template/**/*.jade', {
            base: PROJECT_CONFIG.DIRECTORY.WORK_DIR
        })
        .pipe($.plumber())
        .pipe($.rename({ // https://www.npmjs.com/package/gulp-rename
            extname: '.pug'
        }))
        .pipe(gulp.dest(PROJECT_CONFIG.DIRECTORY.WORK_DIR + '/'))
        .on('end', function(){
            del(PROJECT_CONFIG.DIRECTORY.WORK_DIR + '/template/**/*.jade') // https://www.npmjs.com/package/del
        });
    
});


// Compiling .pug files to HTML code which are completed by information from data object, finally injects into HTML code paths to libraries CSS and JS installed via Bower
gulp.task('pug', function () {

    $.util.log($.util.colors.green('PUG TASK RUNNING...'));
    
    var value = getOption('--lang').value,
        lang = !value ? 'pl' : value;

    if(!value){
        $.util.log($.util.colors.green('Default data object configuration [PL] passed to puge task. To change that, add command arguments to this task ---> gulp [TASK NAME = puge / default / build / build:server] --lang [pl / en]. Before that, do not forget a specify translation in ' + PROJECT_CONFIG.DATA_FILE + ' file.'));
    }
    
    return gulp.src([PROJECT_CONFIG.DIRECTORY.WORK_DIR + '/template/*.pug', PROJECT_CONFIG.DIRECTORY.WORK_DIR + '/template/views/*.pug'], {
            base: './' + PROJECT_CONFIG.DIRECTORY.WORK_DIR + '/template'
        })
        .pipe($.plumber())
        .pipe($.data(function(){ // https://www.npmjs.com/package/gulp-data
            return {
                appName: PROJECT_CONFIG.APP_NAME,
                data: JSON.parse(fs.readFileSync('./' + PROJECT_CONFIG.DATA_FILE, 'utf8')).lang[lang]
            };
        }))
        .pipe($.pug({ // https://pugjs.org/api/getting-started.html
            pretty: true,
            compileDebug: true
        }))
        .pipe(wiredep({ // https://pugjs.org/api/getting-started.html
            exclude: ['animatewithsass', 'angular-mocks', 'bower_components/angular-material/angular-material.css'],
            ignorePath: '../'
        }))
        .pipe(gulp.dest(PROJECT_CONFIG.DIRECTORY.WORK_DIR + '/'));

});


// Validate Pug / Jade Code, atm custom configuration for more info ---> https://github.com/pugjs/pug-lint
gulp.task('pug:lint', function () {

    $.util.log($.util.colors.cyan('PUG LINT TASK RUNNING...'));
    
    return gulp.src(PROJECT_CONFIG.DIRECTORY.WORK_DIR + '/template/**/*.pug')
        .pipe($.plumber())
        .pipe($.pugLint({
            disallowDuplicateAttributes: true,
            disallowMultipleLineBreaks: true,
            disallowSpacesInsideAttributeBrackets: true,
            requireLowerCaseAttributes: true,
            requireLowerCaseTags: true,
            requireSpaceAfterCodeOperator: true,
            requireSpecificAttributes: [{img: ['alt']}],
            validateAttributeQuoteMarks: '\"',
            validateDivTags: true
        })); // https://github.com/pugjs/pug-lint/blob/master/docs/rules.md

});


// Combines CSS or JS files into one and MINIFY - Minification via modules Clean Css & Uglify
gulp.task('html', function () {

    $.util.log($.util.colors.green('HTML TASK RUNNING...'));

    return gulp.src([PROJECT_CONFIG.DIRECTORY.WORK_DIR + '/*.html', PROJECT_CONFIG.DIRECTORY.WORK_DIR + '/views/*.html'], {
            base: PROJECT_CONFIG.DIRECTORY.WORK_DIR
        })
        .pipe($.plumber())
        .pipe($.useref()) // https://www.npmjs.com/package/gulp-useref#api
        .pipe($.if('*.css', $.cleanCss())) // https://github.com/jakubpawlowicz/clean-css#--------
        .pipe($.if('*.js', $.uglify())) // {preserveComments: 'license'} ~ https://www.npmjs.com/package/gulp-uglify#options
        .pipe(gulp.dest(PROJECT_CONFIG.DIRECTORY.DIST_DIR + '/'));

});


// 
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


// 
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


// 
gulp.task('server', function () {

    $.util.log($.util.colors.red('SERVER TASK RUNNING...'));

    return browserSync.init({
        server: PROJECT_CONFIG.DIRECTORY.WORK_DIR + '/'
    });

});


// 
gulp.task('watch', function () {

    $.util.log($.util.colors.blue('WATCH TASK RUNNING...'));

    gulp.watch(PROJECT_CONFIG.DIRECTORY.WORK_DIR + '/sass/**/*.s+(a|c)ss', ['sass:lint', 'sass:css']);
    gulp.watch(PROJECT_CONFIG.DIRECTORY.WORK_DIR + '/js/**/*.js', ['js:hint', browserSync.reload]);
    gulp.watch([PROJECT_CONFIG.DATA_FILE, PROJECT_CONFIG.DIRECTORY.WORK_DIR + '/template/**/*.pug', 'bower.json'], ['pug:lint', 'pug']);
    gulp.watch([PROJECT_CONFIG.DIRECTORY.WORK_DIR + '/*.html', PROJECT_CONFIG.DIRECTORY.WORK_DIR + '/views/*.html'], ['html:hint', browserSync.reload]);

});


// 
gulp.task('clean', function () {

    $.util.log($.util.colors.gray('CLEAN TASK RUNNING...'));

    return del(PROJECT_CONFIG.DIRECTORY.DIST_DIR + '/');

});


// 
gulp.task('copy', function () {

    $.util.log($.util.colors.grey('COPY TASK RUNNING...'));

    return gulp.src([PROJECT_CONFIG.DIRECTORY.WORK_DIR + '/files/**/*', PROJECT_CONFIG.DIRECTORY.WORK_DIR + '/fonts/**/*', PROJECT_CONFIG.DIRECTORY.WORK_DIR + '/img/**/*', '!' + PROJECT_CONFIG.DIRECTORY.WORK_DIR + '/img/{sprites_sources,sprites_sources/**/*}', PROJECT_CONFIG.DIRECTORY.WORK_DIR + '/*.png', PROJECT_CONFIG.DIRECTORY.WORK_DIR + '/*.xml', PROJECT_CONFIG.DIRECTORY.WORK_DIR + '/*.ico'], {
            base: PROJECT_CONFIG.DIRECTORY.WORK_DIR
        })
        .pipe($.plumber())
        .pipe(gulp.dest(PROJECT_CONFIG.DIRECTORY.DIST_DIR + '/'));

});


// 
gulp.task('images', function () {

    $.util.log($.util.colors.magenta('IMAGES TASK RUNNING...'));    
    
    var condition = getOption('--option').value === 'advanced',
        optimizationModule = condition ? require('gulp-tinify') : require('gulp-imagemin'),
        args = PROJECT_CONFIG.API_KEYS.TINIFY;
    
    if(!condition){
        args = [imageminGifsicle(), imageminJpegtran(), imageminOptipng(), imageminSvgo()];
        $.util.log($.util.colors.magenta('Default options passed to images task. To change that, add command arguments to this task ---> gulp [TASK NAME = images / build / build:server] --option [standard / advanced].'));
    }
    
    if(condition && !PROJECT_CONFIG.API_KEYS.TINIFY){
        return $.util.log($.util.colors.magenta('Task can not be complited. Rememeber to set up your TINIFY API KEY in ' + PROJECT_CONFIG.CONFIG_FILE + ' file.'));
    }
    
    return gulp.src(PROJECT_CONFIG.DIRECTORY.DIST_DIR + '/img/**/*', {
            base: PROJECT_CONFIG.DIRECTORY.DIST_DIR
        })
        .pipe($.plumber())
        .pipe(optimizationModule(args))
        .pipe(gulp.dest(PROJECT_CONFIG.DIRECTORY.DIST_DIR + '/'));

});


// 
gulp.task('images:sprite', function () {

    $.util.log($.util.colors.magenta('IMAGES SPRITE TASK RUNNING...'));
    
    var name = getOption('--name').value,
        spriteCssName = !name ? '_sprite' : name,
        spriteImgName = spriteCssName[0] === '_' ? spriteCssName.substring(1) : spriteCssName;
    
    if(!name){
        $.util.log($.util.colors.magenta('Default options passed to images:sprite task. To change that, add command arguments to this task ---> gulp [TASK NAME = images:sprite] --name [_FILE_NAME].'));
    }
    
    return gulp.src(PROJECT_CONFIG.DIRECTORY.WORK_DIR + '/img/sprites_sources/**/*.{jpg,png,gif}')
        .pipe($.plumber())
        .pipe($.spritesmith({
            imgName: spriteImgName + '.png',
            cssName: spriteCssName + '.scss',
            imgPath: '../img/' + spriteImgName + '.png'
        }))
        .pipe($.if('*.png', gulp.dest(PROJECT_CONFIG.DIRECTORY.WORK_DIR + '/img/'), gulp.dest(PROJECT_CONFIG.DIRECTORY.WORK_DIR + '/sass/components/sprites/')));

});


// 
gulp.task('upload', function () {

    $.util.log($.util.colors.yellow('UPLOAD TASK RUNNING...'));
    
    var ftpConfig = {
        host: PROJECT_CONFIG.FTP_CONFIG.HOST,
        user: PROJECT_CONFIG.FTP_CONFIG.USER,
        password: PROJECT_CONFIG.FTP_CONFIG.PASSWORD
    };
    
    if(!ftpConfig.host || !ftpConfig.user || !ftpConfig.password || !getOption('--upload')){
        return $.util.log($.util.colors.yellow('Task can not be complited. Rememeber to set up your FTP CONFIG in ' + PROJECT_CONFIG.CONFIG_FILE + ' file. Then add command argument to this task ---> gulp [TASK NAME = upload / build / build:server] --upload.'));
    }

    var conn = ftp.create(ftpConfig);

    return gulp.src(PROJECT_CONFIG.DIRECTORY.DIST_DIR + '/**/*')
        .pipe($.plumber())
        .pipe(conn.dest('/public_html/'));

});


// 
gulp.task('build', function (cb) {

    $.util.log($.util.colors.red('BUILD TASK RUNNING...'));

    runSequence('clean', 'sass:lint', 'sass:css', 'js:hint', 'pug:lint', 'pug', 'html:hint', 'html', 'html:minify', 'copy', 'images', 'upload', cb);

});


// 
gulp.task('build:server', ['build'], function () {

    $.util.log($.util.colors.red('BUILD SERVER TASK RUNNING...'));

    browserSync.init({
        server: PROJECT_CONFIG.DIRECTORY.DIST_DIR + '/'
    });

});


// 
gulp.task('default', function (cb) {

    $.util.log($.util.colors.red('DEFAULT TASK RUNNING...'));

    runSequence('sass:lint', 'sass:css', 'js:hint', 'pug:lint', 'pug', 'html:hint', 'server', 'watch', cb);

});