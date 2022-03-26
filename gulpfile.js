/*!
 * Gulp SMPL Layout Builder
 *
 * @version 8.3.3 (lite)
 * @author Artem Dordzhiev (Draft) | Cuberto
 * @type Module gulp
 * @license The MIT License (MIT)
 */

/* Get plugins */
const gulp = require("gulp");
const fs = require("fs");

const $ = require("gulp-load-plugins")({
    pattern: ["gulp-*", "gulp.*", "del", "merge-stream"],
});
const browserSync = require("browser-sync");
const plumber = require("gulp-plumber");
const pug = require("gulp-pug");
const sass = require("gulp-sass")(require("sass"));
const autoprefixer = require("gulp-autoprefixer");
const del = require("del");
const webpack = require("webpack-stream");

/* Primary tasks */
gulp.task("default", (done) => {
    gulp.series("serve")(done);
});

gulp.task("serve", (done) => {
    gulp.series(
        "clean",
        gulp.parallel("pug", "sass", "js"),
        "browsersync",
        "watch"
    )(done);
});

/* Pug task */
gulp.task("pug", () => {
    return gulp
        .src(["./src/pug/**/*.pug", "!./src/pug/_includes/**/*"])
        .pipe(plumber())
        .pipe(
            pug({
                pretty: true,
                basedir: "./src/pug/",
            })
        )
        .pipe(gulp.dest("./tmp/"))
        .on("end", () => {
            browserSync.reload();
        });
});

/* Sass task */
gulp.task("sass", () => {
    return gulp
        .src("./src/scss/main.scss")
        .pipe(
            sass({
                includePaths: "node_modules",
            })
        )
        .pipe(autoprefixer())
        .pipe(gulp.dest("./tmp/assets/css/"))
        .pipe(browserSync.stream({ match: "**/*.css" }));
});

/* JS (webpack) task */
gulp.task("js", () => {
    return gulp
        .src(["./src/js/**/*"])
        .pipe(webpack(require("./webpack.config.js")))
        .pipe(gulp.dest("./tmp/assets/js"));
});

/* Browsersync Server */
gulp.task("browsersync", (done) => {
    browserSync.init({
        server: ["./tmp", "./src/static"],
        notify: false,
        ui: false,
        online: false,
        ghostMode: {
            clicks: false,
            forms: false,
            scroll: false,
        },
    });
    done();
});

/* Watcher */
gulp.task("watch", () => {
    global.isWatching = true;

    gulp.watch("./src/scss/**/*.scss", gulp.series("sass"));
    gulp.watch("./src/pug/**/*.pug", gulp.series("pug"));
    gulp.watch("./src/js/**/*.*", gulp.series("js"));
    gulp.watch("./config.json", gulp.parallel("pug", "js"));
});

/* FS tasks */
gulp.task("clean", () => {
    return del(["./tmp/**/*"], { dot: true });
});

gulp.task("build", (done) => {
    gulp.series(
        "clean:dist",
        gulp.parallel("sprites", "svgsprites"),
        gulp.parallel("sass", "js", "copy:static"),
        "pug"
    )(done);
});

gulp.task("svgsprites", (done) => {
    if (!fs.existsSync("./src/icons/") && !done()) return false;
    const config = getConfig("svgsprites");
    const svgSpriteOptions = {
        mode: {
            symbol: {
                dest: "assets/img/sprites/",
                sprite: "svgsprites.svg",
                render: {
                    scss: {
                        dest: "../../../../src/scss/generated/svgsprites.scss",
                        template: "./src/scss/templates/svgsprites.handlebars",
                    },
                },
            },
        },
    };

    return gulp
        .src("./src/icons/*.svg")
        .pipe($.svgSprite(svgSpriteOptions))
        .pipe(gulp.dest(config.dest));
});

gulp.task("sprites", (done) => {
    if (!fs.existsSync("./src/sprites/") && !done()) return false;
    const config = getConfig("sprites");
    const spriteData = gulp.src("./src/sprites/**/*.png").pipe(
        $.spritesmith({
            imgPath: "../img/sprites/sprites.png",
            imgName: "sprites.png",
            retinaImgPath: "../img/sprites/sprites@2x.png",
            retinaImgName: "sprites@2x.png",
            retinaSrcFilter: ["./src/sprites/**/**@2x.png"],
            cssName: "sprites.scss",
            cssTemplate: "./src/scss/templates/sprites.handlebars",
            padding: 1,
        })
    );

    const imgStream = spriteData.img.pipe(gulp.dest(config.dest));

    const cssStream = spriteData.css.pipe(gulp.dest("./src/scss/generated"));

    return $.mergeStream(imgStream, cssStream);
});

/* FS tasks */
gulp.task("clean", () => {
    return $.del(["./tmp/**/*"], { dot: true });
});

gulp.task("clean:dist", () => {
    return $.del(["./dist/**/*"], { dot: true });
});

gulp.task("copy:static", () => {
    return gulp
        .src(["./src/static/**/*"], { dot: true })
        .pipe(gulp.dest("./dist/"));
});
