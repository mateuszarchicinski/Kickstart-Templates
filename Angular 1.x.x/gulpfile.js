var gulp = require("gulp"),
    $ = require("gulp-load-plugins")({
        lazy: true
    }),
    // sass = require("gulp-sass"),
    //shorthand = require('gulp-shorthand'),
    // autoprefixer = require("gulp-autoprefixer"),
    // plumber = require("gulp-plumber"),
    browserSync = require("browser-sync"),
    del = require("del"),
    // useref = require("gulp-useref"),
    // uglify = require("gulp-uglify"),
    // gulpif = require("gulp-if"),
    // htmlhint = require("gulp-htmlhint"),
    // imagemin = require("gulp-imagemin"),
    runSequence = require("run-sequence"),
    ftp = require("vinyl-ftp"),
    argv = require("yargs").argv;
    // gutil = require("gulp-util");

gulp.task("hello", function() {

    console.log("Hello World!");

});

gulp.task("css", function() {

    $.util.log( $.util.colors.yellow("Compiling SASS to CSS...") );

    gulp.src("web/sass/main.scss")
        .pipe($.plumber())
        .pipe($.sass.sync({
            outputStyle: "compressed" // expanded
        }))
        // .pipe($.shorthand())
        .pipe($.autoprefixer()) // {browsers: ["last 5 version", "IE 9"]}
        .pipe(gulp.dest("web/css/"))
        .pipe(browserSync.stream());

});

gulp.task("server", function() {

    browserSync.init({
        server: "web/"
    });

});

gulp.task("watch", function() {

    gulp.watch("web/sass/**/*.scss", ["css"]);
    gulp.watch(["web/*.html", "web/**/*.js"], browserSync.reload);

});

gulp.task("clean", function() {

    return del("dist/");

});

gulp.task("html", function() {

    return gulp.src("web/*.html")
        .pipe($.useref())
        .pipe( $.if("*.js", $.uglify()) )
        // .pipe($.htmlhint({
        //   "tagname-lowercase": true,
        //   "attr-value-double-quotes": false,
        //   "attr-no-duplication": true,
        //   "doctype-first": false,
        //   "tag-pair": true,
        //   "tag-self-close": false,
        //   "spec-char-escape": false,
        //   "id-unique": true,
        //   "src-not-empty": true,
        //   "title-require": true
        // }))
        // .pipe($.htmlhint.failReporter())
        .pipe(gulp.dest("dist/"));

});

gulp.task("images", function() {

    return gulp.src("dist/img/*", {
            base: "dist"
        })
        .pipe($.imagemin())
        .pipe(gulp.dest("dist/"));

});

gulp.task("copy", function() {

    return gulp.src(["web/fonts/*", "web/img/*", "web/files/*", "web/*.ico", "web/*.png"], {
        base: "web"
    })
    .pipe(gulp.dest("dist/"));

});

gulp.task("upload", function() {

    var conn = ftp.create({
        host: "",
        user: "",
        password: ""
    });

    return gulp.src("dist/**/*")
        .pipe($.if(argv.upload, conn.dest("/public_html/")));

});

gulp.task("build", function(cb) {

    runSequence("clean", "css", "html", "copy", "images", "upload", cb);

});

gulp.task("build:server", ["build"], function() {

    browserSync.init({
        server: "dist/"
    });

});

gulp.task("default", ["css", "server", "watch"]);
