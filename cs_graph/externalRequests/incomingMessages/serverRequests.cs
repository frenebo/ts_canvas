using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System.Collections.Generic;

// fields are assigned to from json
#pragma warning disable 0649
namespace ServerRequests {
  public class InvalidServerReqType : System.Exception {
    public InvalidServerReqType(string message) : base(message) {}
  }

  public static class Dispatcher {
    public static void dispatch(JObject jobj, ModelStruct.ModelStruct modelStruct) {
      GenericServerReq genericReq = jobj.ToObject<GenericServerReq>();

      if (genericReq.type == "client_request") {
        ClientRequest.dispatch(jobj, modelStruct);
      } else if (genericReq.type == "layer_data_response") {
        LayerDataResponse.dispatch(jobj);
      } else {
        throw new InvalidServerReqType(genericReq.type);
      }
    }
  }

  internal class GenericServerReq {
    public string type;
  }

  internal struct ClientRequestToServer {
    public string requestId;

    public JObject request;
  }

  internal class ClientRequest {
    public static void dispatch(JObject jobj, ModelStruct.ModelStruct modelStruct) {
      ClientRequest clientReq = jobj.ToObject<ClientRequest>();
      RequestResponder.RequestResponder reqResponder = new RequestResponder.RequestResponder(
        modelStruct,
        clientReq.client_message.requestId,
        clientReq.client_id
      );
      ModelRequests.Dispatcher.dispatch(clientReq.client_message.request, reqResponder, modelStruct);
    }

    public string client_id;
    public ClientRequestToServer client_message;
  }

  internal class LayerDataResponse {
    public static void dispatch(JObject jobj) {
      LayerDataResponse layerDataResponse = jobj.ToObject<LayerDataResponse>();
      // @TODO
    }
    // @TODO
  }
}
#pragma warning restore 0649
