using Newtonsoft.Json;

namespace ServerReqResponses {
  // empty
  class ModelChangeReqResponse {
    public string toJson() {
      return JsonConvert.SerializeObject(this);
    }
  }
  // empty
  class ModelVersioningReqResponse {
    public string toJson() {
      return JsonConvert.SerializeObject(this);
    }
  }

  class ModelInfoReqResponse {
    private readonly string infoJson;
    public ModelInfoReqResponse(string infoString) {
      this.infoJson = infoString;
    }

    public string toJson() {
      return "{\"info\": " + this.infoJson + "}";
    }
  }
  // request_model_changes: {
  //   request: {
  //     type: "request_model_changes";
  //     reqs: ModelChangeRequest[];
  //   };
  //   response: {};
  // };
  // request_versioning_change: {
  //   request: {
  //     type: "request_versioning_change";
  //     req: ModelVersioningRequest;
  //   };
  //   response: {
  //
  //   };
  // };
  // request_model_info: {
  //   request: {
  //     type: "request_model_info";
  //     req: IModelInfoReqs[keyof IModelInfoReqs]["request"];
  //   };
  //   response: {
  //     info: IModelInfoReqs[keyof IModelInfoReqs]["response"];
  //   };
  // }
}
