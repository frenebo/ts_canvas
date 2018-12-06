var gulp = require("gulp");
var ts = require("gulp-typescript");
var del = require("del");
var connect = require('gulp-connect');
var gulpTslint = require("gulp-tslint");
var tslint = require("tslint");

gulp.task("clean", () => del(["build"]));

gulp.task("copy", () => gulp.src(["app/**/*", "!app/scripts/**/*.ts"]).pipe(gulp.dest("build")));

gulp.task("copy_deps", () => {
  return gulp.src(["node_modules/pixi.js/dist/pixi.js"]).pipe(gulp.dest("build/deps/pixi"))
});
gulp.task("electron_copy_deps", () => {
  return gulp.src(["node_modules/pixi.js/dist/pixi.js"]).pipe(gulp.dest("electron_build/deps/pixi"));
})

gulp.task("start_server", function() {
  return connect.server({
    root: "build",
    port: 3000,
  });
});

var project = ts.createProject('tsconfig.json');

gulp.task("ts", function() {
  return gulp.src(["app/scripts/**/*.ts", "node_modules/types/@types/**/*.d.ts"])
    .pipe(project()).js
    .pipe(gulp.dest("build/scripts"));
});


gulp.task("serve", gulp.series(
  "clean",
  "ts",
  "copy",
  "copy_deps",
  "start_server",
));

gulp.task("electron_clean", () => del(["electron_build"]))

gulp.task("electron_ts", function() {
  return gulp.src(["electron/**/*.ts", "node_modules/types/@types/**/*.d.ts"])
    .pipe(ts({
      "module": "commonjs",
      "moduleResolution": "node",
      // "types": [
      //      // add node as an option
      //      "node"
      //  ],
       // "typeRoots" : ["./node_modules/@types"],
    }))
    // .pipe(project()).js
    .pipe(gulp.dest("electron_build"));
});

gulp.task("electron_copy", function() {
  return gulp.src(["electron/**/*", "!electron/**/*.ts"]).pipe(gulp.dest("electron_build"))
});

gulp.task("electron_app_ts", function() {
  return gulp.src(["app/scripts/**/*.ts", "node_modules/types/@types/**/*.d.ts"])
    .pipe(project()).js
    .pipe(gulp.dest("electron_build/app"))
});

gulp.task("electron_copy_app_images", function() {
  return gulp.src(["app/images/**/*"]).pipe(gulp.dest("electron_build/images"));
})

gulp.task("build_electron_app", gulp.series(
  "electron_clean",
  "electron_ts",
  "electron_copy",
  "electron_app_ts",
  "electron_copy_app_images",
  "electron_copy_deps",
));

gulp.task("tslint", function() {
  var program = tslint.Linter.createProgram("./tsconfig.json");

   return gulp.src(["app/scripts/**/*.ts"])
       .pipe(gulpTslint({ program: program }))
       .pipe(gulpTslint.report({
            configuration: {},
            rulesDirectory: null,
            emitError: true,
            reportLimit: 0,
            summarizeFailureOutput: true
        }));;
});
