using Newtonsoft.Json;

namespace ExternalMessageSender {
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

  public static class DataChangedNotifier {
    private class DataChangedNotification {
      public string type = "data_changed_notification";
      public ResponseJson.GraphData newGraphData;

      public DataChangedNotification(ResponseJson.GraphData data) {
        this.newGraphData = data;
      }
    }
    public static void notifyDataChanged(ResponseJson.GraphData data) {
      DataChangedNotification notif = new DataChangedNotification(data);

      System.Console.WriteLine(JsonConvert.SerializeObject(notif));
    }
  }

  public class RequestResponder {
    private string requestId;
    private string clientId;

    public RequestResponder(string requestId, string clientId) {
      this.requestId = requestId;
      this.clientId = clientId;
    }

    public void sendModelChangeReqResponse(ModelChangeReqResponseNS.ModelChangeReqResponse response) {
      ReqResponse<ModelChangeReqResponseNS.ModelChangeReqResponse> reqResponse = new ReqResponse<ModelChangeReqResponseNS.ModelChangeReqResponse>(
        this.requestId,
        this.clientId,
        response
      );

      string responseStr = JsonConvert.SerializeObject(reqResponse);

      System.Console.WriteLine(responseStr);
    }

    public void sendVersioningChangeReqResponse(ModelVersioningReqResponses.ModelVersioningReqResponse response) {
      ReqResponse<ModelVersioningReqResponses.ModelVersioningReqResponse> reqResponse = new ReqResponse<ModelVersioningReqResponses.ModelVersioningReqResponse>(
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
