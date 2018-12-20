using ServerReqResponses;
using Newtonsoft.Json;

namespace RequestResponder {
  internal class ReqResponse<T> {
    public string type = "request_response";
    public string request_id;
    public string client_id;
    public T response;

    public ReqResponse(string request_id, string client_id, T response) {
      this.request_id = request_id;
      this.client_id = client_id;
      this.response = response;
    }
  }

  public class RequestResponder {
    private string requestId;
    private string clientId;

    public RequestResponder(ModelStruct.ModelStruct modelStruct, string requestId, string clientId) {
      this.requestId = requestId;
      this.clientId = clientId;
    }

    public void sendModelChangeReqResponse(ModelChangeReqResponse response) {
      ReqResponse<ModelChangeReqResponse> reqResponse = new ReqResponse<ModelChangeReqResponse>(
        this.requestId,
        this.clientId,
        response
      );

      string responseStr = JsonConvert.SerializeObject(reqResponse);

      System.Console.WriteLine(responseStr);
    }

    public void sendVersioningChangeReqResponse(ModelVersioningReqResponse response) {
      ReqResponse<ModelVersioningReqResponse> reqResponse = new ReqResponse<ModelVersioningReqResponse>(
        this.requestId,
        this.clientId,
        response
      );

      string responseStr = JsonConvert.SerializeObject(reqResponse);

      System.Console.WriteLine(responseStr);
    }

    public void sendModelInfoReqResponse(ModelInfoReqResponses.ModelInfoReqResponse response) {
      ReqResponse<ModelInfoReqResponses.ModelInfoReqResponse> reqResponse = new ReqResponse<ModelInfoReqResponses.ModelInfoReqResponse>(
        this.requestId,
        this.clientId,
        response
      );

      string responseStr = JsonConvert.SerializeObject(reqResponse);

      System.Console.WriteLine(responseStr);
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
  // }
}
