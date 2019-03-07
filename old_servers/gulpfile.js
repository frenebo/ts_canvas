var gulp = require("gulp");
var ts = require("gulp-typescript");
var del = require("del");

gulp.task("server_clean", () => del(["graph_server/build"]));

gulp.task("server_ts", function() {
  var server_project = ts.createProject("graph_server/tsconfig.json");
  return gulp.src(["graph_server/ts_scripts/**/*.ts"])
    .pipe(server_project()).js
    .pipe(gulp.dest("graph_server/build"));
});

gulp.task("build", gulp.series(
  "server_clean",
  "server_ts",
));
