var gulp = require("gulp");
var ts = require("gulp-typescript");
var del = require("del");
var connect = require('gulp-connect');
var gulpTslint = require("gulp-tslint");
var tslint = require("tslint");

gulp.task("clean", () => del(["build"]));

gulp.task("copy", () => gulp.src(["app/**/*", "!app/**/*.ts"]).pipe(gulp.dest("build")));

gulp.task("copy_deps", () => {
  return gulp.src(["node_modules/pixi.js/dist/pixi.js"]).pipe(gulp.dest("build/deps/pixi"))
});

gulp.task("start_server", () => {
  return connect.server({
    root: "build",
    port: 5000,
  });
});

var project = ts.createProject('tsconfig.json');

gulp.task("ts", function() {
  return gulp.src(["app/**/*.ts", "node_modules/types/@types/**/*.d.ts"])
    .pipe(project()).js
    .pipe(gulp.dest("build"));
});


gulp.task("serve", gulp.series(
  "clean",
  "ts",
  "copy",
  "copy_deps",
  "start_server",
));

gulp.task("tslint", function() {
  var program = tslint.Linter.createProgram("./tsconfig.json");

   return gulp.src(["app/**/*.ts"])
       .pipe(gulpTslint({ program: program }))
       .pipe(gulpTslint.report({
            configuration: {},
            rulesDirectory: null,
            emitError: true,
            reportLimit: 0,
            summarizeFailureOutput: true
        }));;
});
