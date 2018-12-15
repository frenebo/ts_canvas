
/// <reference path="../../interfaces/interfaces.d.ts"/>
/// <reference path="../../interfaces/serverRequestInterfaces.d.ts"/>
// import { spawn } from "child_process"
import { Model } from "./model/model";

const model = new Model();

model.onDataChanged(() => {
  console.log(JSON.stringify({
    type: "data_changed_notification",
  }));
});
process.stdin.on("data", function (chunk) {
  const mssg: {
    client_id: string;
    client_message: MessageToServer;
  } = JSON.parse(chunk);
  if (mssg.client_message.request.type === "get_graph_data") {
    model.getGraphData().then((data) => {
      const response: IServerReqTypes["get_graph_data"]["response"] = {success: true, data: data}
      console.log(JSON.stringify({
        type: "request_response",
        request_id: mssg.client_message.requestId,
        client_id: mssg.client_id,
        response: response,
      }));
    });
  } else if (mssg.client_message.request.type === "request_model_changes") {
    model.requestModelChanges(...mssg.client_message.request.reqs).then(() => {
      const response: IServerReqTypes["request_model_changes"]["response"] = {};
      console.log(JSON.stringify({
        type: "request_response",
        request_id: mssg.client_message.requestId,
        client_id: mssg.client_id,
        response: response,
      }));
    });
  } else if (mssg.client_message.request.type === "request_versioning_change") {
    model.requestModelVersioningChange(mssg.client_message.request.req).then(() => {
      const response: IServerReqTypes["request_versioning_change"]["response"] = {};
      console.log(JSON.stringify({
        type: "request_response",
        request_id: mssg.client_message.requestId,
        client_id: mssg.client_id,
        response: response,
      }));
    });
  } else if (mssg.client_message.request.type === "request_model_info") {
    model.requestModelInfo(mssg.client_message.request.req).then((modelResponse) => {
      const response: IServerReqTypes["request_model_info"]["response"] ={info:modelResponse};
      console.log(JSON.stringify({
        type: "request_response",
        request_id: mssg.client_message.requestId,
        client_id: mssg.client_id,
        response: response,
      }));
    })
  }
});

// without this, we would only get streams once enter is pressed
// process.stdin.setRawMode!( true );

// resume stdin in the parent process (node app won't quit all by itself
// unless an error or process.exit() happens)
process.stdin.resume();

process.stdin.setEncoding( 'utf8' );
// var stdin = process.openStdin();
// // require('tty').setRawMode(true);
//
// stdin.on('data', function (chunk, key) {
//   console.log("data recceived");
//   // process.stdout.write('Get Chunk: ' + chunk + '\n');
//   // if (key && key.ctrl && key.name == 'c') process.exit();
// });

// process.stdin.on('data', function() {
//   var chunk = process.stdin.read();
//   if (chunk !== null) {
//     process.stdout.write('data: ' + chunk);
//   }
// });
// let data = "";
// process.stdin.on('readable', function() {
//   var chunk;
//   while (chunk = process.stdin.read()) {
//     data += chunk;
//   }
// });
//
// process.stdin.on('end', function () {
//   // There will be a trailing \n from the user hitting enter. Get rid of it.
//   data = data.replace(/\n$/, '');
//   processData();
// });
// function processData () {
//   console.log(data);
//   console.info(Buffer.byteLength(data, encoding));
// }
// // function showArrEl (key) {
// //   console.log(arr[key]);
// // }
//
// // process.stdin.on("data", (chunk) => {
// //   console.log(chunk);
// // });
