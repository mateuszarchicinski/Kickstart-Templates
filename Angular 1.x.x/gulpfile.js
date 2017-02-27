'use strict';


// NODE MODULES
var gulp = require('gulp'), // https://gulp.readme.io/docs/getting-started
    $ = require('gulp-load-plugins')({ // https://github.com/jackfranklin/gulp-load-plugins#options
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
// Compiling SASS to CSS, adding right prefixes to CSS methods - depending on configuration, creating source map, finally injects CSS styles into browser
gulp.task('sass:css', function () {

    $.util.log($.util.colors.green('SASS TO CSS TASK RUNNING...')); // https://github.com/gulpjs/gulp-util#usage

    return gulp.src(PROJECT_CONFIG.DIRECTORY.WORK_DIR + '/sass/main.s+(a|c)ss')
        .pipe($.plumber()) // https://github.com/floatdrop/gulp-plumber#monkey-gulp-plumber
        .pipe($.sourcemaps.init()) // https://github.com/floridoo/gulp-sourcemaps#init-options
        .pipe($.sass.sync({ // https://github.com/sass/node-sass#options
            outputStyle: 'nested' // compact - compressed - expanded - nested
        }))
        .pipe($.autoprefixer({ // https://github.com/postcss/autoprefixer#options
            browsers: ['last 5 version'],
            stats: ['> 1%']
        }))
        .pipe($.sourcemaps.write('./maps'))
        .pipe(gulp.dest(PROJECT_CONFIG.DIRECTORY.WORK_DIR + '/css/'))
        .pipe(browserSync.stream({match: '**/*.css'})); // https://www.browsersync.io/docs/gulp

});


// Validates Syntactically Awesome Style Sheets (SASS) Code, atm custom configuration for more info / rules check ---> https://github.com/sasstools/sass-lint#configuring
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


// Validates JavaScript (JS) Code, atm default configuration for more info check ---> http://jshint.com/docs/
gulp.task('js:hint', function () {

    $.util.log($.util.colors.cyan('JS HINT TASK RUNNING...'));

    return gulp.src(PROJECT_CONFIG.DIRECTORY.WORK_DIR + '/js/**/*.js')
        .pipe($.plumber())
        .pipe($.jshint())
        .pipe($.jshint.reporter(jshintStylish)); // https://github.com/spalger/gulp-jshint#reporters

});


// Runs unit tests in Karma environment which is configurable via karma.conf.js for more info check ---> https://karma-runner.github.io/1.0/index.html
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
        .pipe($.rename({ // https://github.com/hparra/gulp-rename#usage
            extname: '.pug'
        }))
        .pipe(gulp.dest(PROJECT_CONFIG.DIRECTORY.WORK_DIR + '/'))
        .on('end', function(){
            del(PROJECT_CONFIG.DIRECTORY.WORK_DIR + '/template/**/*.jade') // https://github.com/sindresorhus/del#usage
        });
    
});


// Compiling .pug files to HTML code which is completed by information from data object, finally injects into HTML code tags LINK & SCRIPT with paths to libraries CSS and JS installed via Bower
gulp.task('pug', function () {

    $.util.log($.util.colors.green('PUG TASK RUNNING...'));
    
    var value = getOption('--lang').value,
        lang = !value ? PROJECT_CONFIG.LANGUAGES[0] : value,
        languages = PROJECT_CONFIG.LANGUAGES;

    if (!value) {
        $.util.log($.util.colors.green('Default data object configuration [PL] passed to puge task. To change that, add command arguments to this task ---> gulp [TASK NAME = puge / default / build / build:server] --lang [pl / en]. Before that, do not forget a specify translation in ' + PROJECT_CONFIG.DATA_FILE + ' file.'));
    }
    
    if(getOption('build')){
        for (var i in languages) {
            if (languages[i] !== lang) {
                gulp.src([PROJECT_CONFIG.DIRECTORY.WORK_DIR + '/template/views/' + languages[i] + '/**/*.pug'], {
                    base: './' + PROJECT_CONFIG.DIRECTORY.WORK_DIR + '/template'
                })
                .pipe($.plumber())
                .pipe($.data(function(){ // https://github.com/colynb/gulp-data#gulp-data
                    return {
                        appName: PROJECT_CONFIG.APP_NAME,
                        data: JSON.parse(fs.readFileSync('./' + PROJECT_CONFIG.DATA_FILE, 'utf8')).lang[languages[i]]
                    };
                }))
                .pipe($.pug({ // https://pugjs.org/api/getting-started.html
                    pretty: true,
                    compileDebug: true
                }))
                .pipe(gulp.dest(PROJECT_CONFIG.DIRECTORY.WORK_DIR + '/'));
            }
        }
    }
    
    return gulp.src([PROJECT_CONFIG.DIRECTORY.WORK_DIR + '/template/*.pug', PROJECT_CONFIG.DIRECTORY.WORK_DIR + '/template/views/' + lang + '/**/*.pug'], {
            base: './' + PROJECT_CONFIG.DIRECTORY.WORK_DIR + '/template'
        })
        .pipe($.plumber())
        .pipe($.data(function(){
            return {
                appName: PROJECT_CONFIG.APP_NAME,
                data: JSON.parse(fs.readFileSync('./' + PROJECT_CONFIG.DATA_FILE, 'utf8')).lang[lang]
            };
        }))
        .pipe($.pug({
            pretty: true,
            compileDebug: true
        }))
        .pipe(wiredep({ // https://github.com/taptapship/wiredep#wiredep--
            exclude: ['animatewithsass', 'angular-mocks', 'bower_components/angular-material/angular-material.css'],
            ignorePath: '../'
        }))
        .pipe(gulp.dest(PROJECT_CONFIG.DIRECTORY.WORK_DIR + '/'));

});


// Validates Pug / Jade Code, atm custom configuration for more info check ---> https://github.com/pugjs/pug-lint#pug-lint
gulp.task('pug:lint', function () {

    $.util.log($.util.colors.cyan('PUG LINT TASK RUNNING...'));
    
    return gulp.src(PROJECT_CONFIG.DIRECTORY.WORK_DIR + '/template/**/*.pug')
        .pipe($.plumber())
        .pipe($.pugLint({ // https://github.com/pugjs/pug-lint/blob/master/docs/rules.md
            disallowDuplicateAttributes: true,
            disallowMultipleLineBreaks: true,
            disallowSpacesInsideAttributeBrackets: true,
            requireLowerCaseAttributes: true,
            requireLowerCaseTags: true,
            requireSpaceAfterCodeOperator: true,
            requireSpecificAttributes: [{img: ['alt']}],
            validateAttributeQuoteMarks: '\"',
            validateDivTags: true
        }));

});


// Combines CSS or JS files into one and MINIFY - Minification via modules Clean Css & Uglify
gulp.task('html', function () {

    $.util.log($.util.colors.green('HTML TASK RUNNING...'));

    return gulp.src([PROJECT_CONFIG.DIRECTORY.WORK_DIR + '/*.html', PROJECT_CONFIG.DIRECTORY.WORK_DIR + '/views/**/*.html'], {
            base: PROJECT_CONFIG.DIRECTORY.WORK_DIR
        })
        .pipe($.plumber())
        .pipe($.useref()) // https://github.com/jonkemp/gulp-useref#usage
        .pipe($.if('*.css', $.cleanCss())) // https://github.com/jakubpawlowicz/clean-css#--------
        .pipe($.if('*.js', $.uglify())) // {preserveComments: 'license'} ~ https://github.com/terinjokes/gulp-uglify#options
        .pipe(gulp.dest(PROJECT_CONFIG.DIRECTORY.DIST_DIR + '/'));

});


// Validates HyperText Markup Language (HTML) code, atm custom configuration for more info / rules check ---> https://github.com/bezoerb/gulp-htmlhint#api
gulp.task('html:hint', function () {

    $.util.log($.util.colors.cyan('HTML HINT TASK RUNNING...'));

    return gulp.src([PROJECT_CONFIG.DIRECTORY.WORK_DIR + '/*.html', PROJECT_CONFIG.DIRECTORY.WORK_DIR + '/views/*.html'])
        .pipe($.plumber())
        .pipe($.htmlhint({ // https://github.com/yaniswang/HTMLHint/wiki/Rules
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
        .pipe($.htmlhint.reporter(htmlhintStylish)); // https://github.com/bezoerb/gulp-htmlhint#reporters

});


// Minify HTML code, atm custom configuration for more info check ---> https://github.com/jonschlinkert/gulp-htmlmin#gulp-htmlmin---
gulp.task('html:minify', function () {

    $.util.log($.util.colors.green('HTML MINIFY TASK RUNNING...'));

    return gulp.src([PROJECT_CONFIG.DIRECTORY.DIST_DIR + '/*.html', PROJECT_CONFIG.DIRECTORY.DIST_DIR + '/views/*.html'], {
            base: PROJECT_CONFIG.DIRECTORY.DIST_DIR
        })
        .pipe($.plumber())
        .pipe($.htmlmin({ // https://github.com/kangax/html-minifier#options-quick-reference
            collapseWhitespace: true,
            minifyCSS: true,
            minifyJS: true,
            removeComments: true
        }))
        .pipe(gulp.dest(PROJECT_CONFIG.DIRECTORY.DIST_DIR + '/'));

});


// Runs locally server which allows to sync file changes with browser preview and to browse websites using connected devices, more info about module BROWSER SYNC ---> https://www.browsersync.io/docs/gulp
gulp.task('server', function () {

    $.util.log($.util.colors.red('SERVER TASK RUNNING...'));

    return browserSync.init({ // https://www.browsersync.io/docs/options
        server: PROJECT_CONFIG.DIRECTORY.WORK_DIR + '/'
    });

});


// Watching file changes then runs appropriate tasks
gulp.task('watch', function () {

    $.util.log($.util.colors.blue('WATCH TASK RUNNING...'));
    
    gulp.watch(PROJECT_CONFIG.DIRECTORY.WORK_DIR + '/sass/**/*.s+(a|c)ss', ['sass:lint', 'sass:css']);
    gulp.watch(PROJECT_CONFIG.DIRECTORY.WORK_DIR + '/js/**/*.js', ['js:watch']);
    gulp.watch([PROJECT_CONFIG.DATA_FILE, PROJECT_CONFIG.DIRECTORY.WORK_DIR + '/template/**/*.pug', 'bower.json'], ['pug:lint', 'pug']);
    gulp.watch([PROJECT_CONFIG.DIRECTORY.WORK_DIR + '/*.html', PROJECT_CONFIG.DIRECTORY.WORK_DIR + '/views/**/*.html'], ['html:watch']);

});


// Created to fix problem with browserSync.reload, more info ---> https://github.com/BrowserSync/browser-sync/issues/717#issuecomment-119713757
gulp.task('js:watch', ['js:hint'], browserSync.reload);


// Created to fix problem with browserSync.reload, more info ---> https://github.com/BrowserSync/browser-sync/issues/717#issuecomment-119713757
gulp.task('html:watch', ['html:hint'], browserSync.reload);


// Removes production directory, more info about module DEL ---> https://github.com/sindresorhus/del#del--
gulp.task('clean', function () {

    $.util.log($.util.colors.gray('CLEAN TASK RUNNING...'));

    return del(PROJECT_CONFIG.DIRECTORY.DIST_DIR + '/');

});


// Copies a files from the working directory to the production directory
gulp.task('copy', function () {

    $.util.log($.util.colors.grey('COPY TASK RUNNING...'));

    return gulp.src([PROJECT_CONFIG.DIRECTORY.WORK_DIR + '/files/**/*', PROJECT_CONFIG.DIRECTORY.WORK_DIR + '/fonts/**/*', PROJECT_CONFIG.DIRECTORY.WORK_DIR + '/img/**/*', '!' + PROJECT_CONFIG.DIRECTORY.WORK_DIR + '/img/{sprites_sources,sprites_sources/**/*}', PROJECT_CONFIG.DIRECTORY.WORK_DIR + '/*.png', PROJECT_CONFIG.DIRECTORY.WORK_DIR + '/*.xml', PROJECT_CONFIG.DIRECTORY.WORK_DIR + '/*.ico'], {
            base: PROJECT_CONFIG.DIRECTORY.WORK_DIR
        })
        .pipe($.plumber())
        .pipe(gulp.dest(PROJECT_CONFIG.DIRECTORY.DIST_DIR + '/'));

});


// Optimizes images by using standard modules avaible via NPM or by TinyPNG API ---> https://tinypng.com/developers/reference/nodejs
gulp.task('images', function () {

    $.util.log($.util.colors.magenta('IMAGES TASK RUNNING...'));    
    
    var condition = getOption('--option').value === 'advanced', // https://github.com/joshbroton/gulp-tinify#gulp-tinify
        optimizationModule = condition ? require('gulp-tinify') : require('gulp-imagemin'), // https://github.com/sindresorhus/gulp-imagemin#api
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


// Creates so-called spritesheet which consists files .png thet merged multiple images and .scss that styles  ---> https://github.com/Ensighten/spritesmith#spritesmith--
gulp.task('images:sprite', function () {

    $.util.log($.util.colors.magenta('IMAGES SPRITE TASK RUNNING...'));
    
    var name = getOption('--name').value,
        spriteCssName = !name ? '_sprite' : name,
        spriteImgName = spriteCssName[0] === '_' ? spriteCssName.substring(1) : spriteCssName;
    
    if(!name){
        $.util.log($.util.colors.magenta('Default options passed to images:sprite task. To change that, add command arguments to this task ---> gulp [TASK NAME = images:sprite] --name [_FILE_NAME].'));
    }
    
    gulp.src(PROJECT_CONFIG.DIRECTORY.WORK_DIR + '/img/sprites_sources/**/*.{jpg,png,gif}')
        .pipe($.plumber())
        .pipe($.spritesmith({ // https://github.com/twolfson/gulp.spritesmith#documentation
            imgName: spriteImgName + '.png',
            cssName: spriteCssName + '.scss',
            imgPath: '../img/' + spriteImgName + '.png'
        }))
        .pipe($.if('*.png', gulp.dest(PROJECT_CONFIG.DIRECTORY.WORK_DIR + '/img/'), gulp.dest(PROJECT_CONFIG.DIRECTORY.WORK_DIR + '/sass/components/sprites/'))); // https://github.com/robrich/gulp-if#gulp-if-api

});


// 
gulp.task('upload', function () {

    $.util.log($.util.colors.yellow('UPLOAD TASK RUNNING...'));
    
    var ftpConfig = {
        host: PROJECT_CONFIG.FTP_CONFIG.HOST,
        user: PROJECT_CONFIG.FTP_CONFIG.USER,
        password: PROJECT_CONFIG.FTP_CONFIG.PASSWORD,
        secure: true
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