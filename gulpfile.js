var gulp = require("gulp");
var ts = require("gulp-typescript");
var del = require("del");
var gulpTslint = require("gulp-tslint");
var tslint = require("tslint");

gulp.task("client_clean", () => del(["client/build"]));

gulp.task("client_copy", () => gulp.src(["client/app/**/*", "!client/app/**/*.ts"]).pipe(gulp.dest("client/build")));

gulp.task("client_copy_pixi", () => {
  return gulp.src(["node_modules/pixi.js/dist/pixi.js"]).pipe(gulp.dest("client/build/deps/pixi"))
});
gulp.task("client_copy_socketio", () => {
  return gulp.src(["node_modules/socket.io-client/dist/socket.io.js"]).pipe(gulp.dest("client/build/deps/socketio"))
});

gulp.task("client_ts", function() {
  var client_project = ts.createProject('client/tsconfig.json');
  return gulp.src(["client/app/**/*.ts", "node_modules/types/@types/**/*.d.ts"])
    .pipe(client_project()).js
    .pipe(gulp.dest("client/build"));
});

gulp.task("server_clean", () => del(["graph_server/build"]));

gulp.task("server_ts", function() {
  var server_project = ts.createProject("graph_server/tsconfig.json");
  return gulp.src(["graph_server/ts_scripts/**/*.ts"])
    .pipe(server_project()).js
    .pipe(gulp.dest("graph_server/build"));
});

gulp.task("build", gulp.series(
  "client_clean",
  "client_ts",
  "client_copy",
  "client_copy_pixi",
  "client_copy_socketio",

  "server_clean",
  "server_ts",
));
//
// gulp.task("tslint", function() {
//   var program = tslint.Linter.createProgram("./tsconfig.json");
//
//    return gulp.src(["client/app/**/*.ts"])
//        .pipe(gulpTslint({ program: program }))
//        .pipe(gulpTslint.report({
//             configuration: {},
//             rulesDirectory: null,
//             emitError: true,
//             reportLimit: 0,
//             summarizeFailureOutput: true
//         }));;
// });
