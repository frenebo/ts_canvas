
/// <reference path="./interfaces.d.ts"/>
type IEnforceRequestType<T extends string> = {
  [key in T]: {
    request: {type: T};
    response: unknown;
  };
};

interface IServerReqTypes extends IEnforceRequestType<keyof IServerReqTypes> {
  request_model_changes: {
    request: {
      type: "request_model_changes";
      reqs: ModelChangeRequest[];
    };
    response: {};
  };
  request_versioning_change: {
    request: {
      type: "request_versioning_change";
      req: ModelVersioningRequest;
    };
    response: {

    };
  };
  request_model_info: {
    request: {
      type: "request_model_info";
      req: IModelInfoReqs[keyof IModelInfoReqs]["request"];
    };
    response: {
      info: IModelInfoReqs[keyof IModelInfoReqs]["response"];
    };
  }
}

type MessageToServer = {
  requestId: string;
  request: IServerReqTypes[keyof IServerReqTypes]["request"];
};

type MessageFromServer = {
  type: "graph_data_changed";
  graphData: IGraphData;
} | {
  type: "request_response";
  requestId: string;
  response: IServerReqTypes[keyof IServerReqTypes]["response"];
}
