
/// <reference path="../../interfaces/interfaces.d.ts"/>
/// <reference path="../../interfaces/serverRequestInterfaces.d.ts"/>

import { Model } from "./model/model";
import { IServerUtils, ILayerReqTypes, ServerResponse } from "./model/server_utils/server_utils";
const createDiff: DiffCreator = require("./deps/diff/diff.js").createDiff;

const pendingLayerInfoReqs: {[key: string]: (val: ServerResponse<keyof ILayerReqTypes>) => void} = {};
function uniqueLayerReqId(): string {
  const num = Math.random();
  let multiplier = 10;
  while (pendingLayerInfoReqs[Math.floor(num*multiplier).toString()] !== undefined) {
    multiplier *= 10;
  }

  return Math.floor(num*multiplier).toString();
}

const serverUtils: IServerUtils = {
  makeLayerInfoReq: function<T extends keyof ILayerReqTypes>(
    req: ILayerReqTypes[T]["request"],
  ): Promise<ServerResponse<T>> {
    const reqId: string = uniqueLayerReqId();
    stdoutMssg({
      type: "requesting_layer_info",
      request: req,
      request_id: reqId,
    });
    return new Promise<ServerResponse<T>>((resolve) => {
      pendingLayerInfoReqs[reqId] = (val: ServerResponse<T>) => {
        resolve(val);
      }
    });
  }
}

const model = new Model(serverUtils, createDiff);

type IStdoutMssg = {
  type: "request_response";
  request_id: string;
  client_id: string;
  response: IServerReqTypes[keyof IServerReqTypes]["response"];
} | {
  type: "data_changed_notification";
  newGraphData: IGraphData;
} | {
  type: "requesting_layer_info";
  request: ILayerReqTypes[keyof ILayerReqTypes]["request"];
  request_id: string;
};

function stdoutMssg(mssg: IStdoutMssg) {
  console.log(JSON.stringify(mssg));
}

model.onDataChanged(async () => {
  stdoutMssg({
    type: "data_changed_notification",
    newGraphData: (await model.requestModelInfo<"getGraphData">({type: "getGraphData"})).data
  });
});

let currentLine = "";
process.stdin.on("data", function (newText: string) {
  let unprocessedText = newText;
  let returnIdx: number;
  while ((returnIdx = unprocessedText.indexOf("\n")) !== -1) {
    const beforeReturn = unprocessedText.slice(0, returnIdx);
    unprocessedText = unprocessedText.slice(returnIdx + 1);
    if (beforeReturn.trim() !== "") {
      currentLine += beforeReturn;
      processStdinLine(currentLine);
      currentLine = "";
    }
  }
  currentLine += unprocessedText;
});

function processStdinLine(line: string) {
  const mssg: {
    type: "client_request";
    client_id: string;
    client_message: MessageToServer;
  } | {
    type: "layer_data_response";
    response: ServerResponse<keyof ILayerReqTypes>;
    request_id: string;
  } = JSON.parse(line);
  if (mssg.type === "client_request") {
    if (mssg.client_message.request.type === "request_model_changes") {
      model.requestModelChanges(...mssg.client_message.request.reqs).then(() => {
        const response: IServerReqTypes["request_model_changes"]["response"] = {};
        stdoutMssg({
          type: "request_response",
          request_id: mssg.client_message.requestId,
          client_id: mssg.client_id,
          response: response,
        });
      });
    } else if (mssg.client_message.request.type === "request_versioning_change") {
      model.requestModelVersioningChange(mssg.client_message.request.req).then(() => {
        const response: IServerReqTypes["request_versioning_change"]["response"] = {};
        stdoutMssg({
          type: "request_response",
          request_id: mssg.client_message.requestId,
          client_id: mssg.client_id,
          response: response,
        });
      });
    } else if (mssg.client_message.request.type === "request_model_info") {
      model.requestModelInfo(mssg.client_message.request.req).then((response) => {
        stdoutMssg({
          type: "request_response",
          request_id: mssg.client_message.requestId,
          client_id: mssg.client_id,
          response: response,
        });
      })
    }
  } else if (mssg.type === "layer_data_response") {
    const pending = pendingLayerInfoReqs[mssg.request_id];
    if (pending === undefined) return;

    pending(mssg.response);
    delete pendingLayerInfoReqs[mssg.request_id];
  }
}

process.stdin.resume();
process.stdin.setEncoding( 'utf8' );
