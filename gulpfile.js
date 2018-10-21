var gulp = require("gulp");
var ts = require("gulp-typescript");
var del = require("del");
var connect = require('gulp-connect');

gulp.task("clean", () => del(["build"]));

gulp.task("copy", () => gulp.src(["app/**/*", "!app/scripts/**/*.ts"]).pipe(gulp.dest("build")));

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


gulp.task("serve", gulp.series("clean", "ts", "copy", "start_server"));
