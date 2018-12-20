using Newtonsoft.Json;
using System.Collections.Generic;

// fields are assigned to from json
#pragma warning disable 0649
namespace ServerRequests {
  public class InvalidServerReqType : System.Exception {
    public InvalidServerReqType(string message) : base(message) {}
  }

  public static class Dispatcher {
    public static void dispatch(string str, ModelClass.ModelClass modelClass) {
      GenericServerReq genericReq = GenericServerReq.fromJson(str);

      if (genericReq.type == "client_request") {
        ClientRequest.dispatch(str, modelClass);
      } else if (genericReq.type == "layer_data_response") {
        LayerDataResponse.dispatch(str);
      } else {
        throw new InvalidServerReqType(genericReq.type);
      }
    }
  }

  internal class GenericServerReq {
    public static GenericServerReq fromJson(string str) {
      return JsonConvert.DeserializeObject<GenericServerReq>(str);
    }

    public string type;
  }

  internal struct ClientRequestToServer {
    public string requestId;

    [JsonConverter(typeof(JsonUtils.ConvertObjectToString))]
    public string request;
  }

  internal class ClientRequest {
    public static void dispatch(string str, ModelClass.ModelClass modelClass) {
      ClientRequest clientReq = JsonConvert.DeserializeObject<ClientRequest>(str);
      RequestResponder.RequestResponder reqResponder = new RequestResponder.RequestResponder(
        modelClass,
        clientReq.client_message.requestId,
        clientReq.client_id
      );
      ModelRequests.Dispatcher.dispatch(clientReq.client_message.request, reqResponder);
    }

    public string client_id;
    public ClientRequestToServer client_message;
  }

  internal class LayerDataResponse {
    public static void dispatch(string str) {
      LayerDataResponse layerDataResponse = JsonConvert.DeserializeObject<LayerDataResponse>(str);
      // @TODO
    }
    // @TODO
  }
}
#pragma warning restore 0649
