using Newtonsoft.Json;

namespace OutJsonMessages {
  class RequestResponse {
    public readonly string type = "request_response";
    public readonly string client_id;
    public readonly string request_id;

    public RequestResponse(string requestId, string clientId) {
      this.request_id = requestId;
      this.client_id = clientId;
      throw new System.Exception("Unimplemented response");
    }

    public string toJson() {
      return JsonConvert.SerializeObject(this);
    }
  }

  class DataChangedNotification {
    public readonly string type = "data_changed_notification";

    public DataChangedNotification() {}

    public string toJson() {
      return JsonConvert.SerializeObject(this);
    }
  }

  class LayerInfoRequest {
    public readonly string type = "requesting_layer_info";
    public readonly string request_id;

    public LayerInfoRequest(string requestId) {
      this.request_id = requestId;
    }

    public string toJson() {
      return JsonConvert.SerializeObject(this);
    }
  }

  // {
  //   type: "request_response";
  //   request_id: string;
  //   client_id: string;
  //   response: IServerReqTypes[keyof IServerReqTypes]["response"];
  // } | {
  //   type: "data_changed_notification";
  // } | {
  //   type: "requesting_layer_info";
  //   request: ILayerReqTypes[keyof ILayerReqTypes]["request"];
  //   request_id: string;
  // };
}
