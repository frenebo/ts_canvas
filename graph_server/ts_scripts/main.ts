
/// <reference path="../../interfaces/interfaces.d.ts"/>
// import { spawn } from "child_process"
import { Model } from "./model/model";

const model = new Model();

// function printSomething() {
//   process.stdout.write("asdf\n");
//   console.log("asfaslkdfjaskldfjlk");
//   setTimeout(printSomething, 1000);
// }
// printSomething();
const encoding = "utf-8";
process.stdin.setEncoding(encoding);

let data = "";
process.stdin.on('readable', function() {
  var chunk;
  while (chunk = process.stdin.read()) {
    data += chunk;
  }
});

process.stdin.on('end', function () {
  // There will be a trailing \n from the user hitting enter. Get rid of it.
  data = data.replace(/\n$/, '');
  processData();
});
function processData () {
  console.log(data);
  console.info(Buffer.byteLength(data, encoding));
}
// function showArrEl (key) {
//   console.log(arr[key]);
// }

// process.stdin.on("data", (chunk) => {
//   console.log(chunk);
// });
