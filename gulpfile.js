var gulp = require("gulp");
var ts = require("gulp-typescript");
var del = require("del");
var gulpTslint = require("gulp-tslint");
var tslint = require("tslint");

gulp.task("clean", () => del(["build"]));

gulp.task("copy", () => gulp.src(["app/**/*", "!app/**/*.ts"]).pipe(gulp.dest("build")));

gulp.task("copy_deps", () => {
  return gulp.src(["node_modules/pixi.js/dist/pixi.js"]).pipe(gulp.dest("build/deps/pixi"))
});

var project = ts.createProject('tsconfig.json');

gulp.task("ts", function() {
  return gulp.src(["app/**/*.ts", "node_modules/types/@types/**/*.d.ts"])
    .pipe(project()).js
    .pipe(gulp.dest("build"));
});


gulp.task("build", gulp.series(
  "clean",
  "ts",
  "copy",
  "copy_deps",
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
