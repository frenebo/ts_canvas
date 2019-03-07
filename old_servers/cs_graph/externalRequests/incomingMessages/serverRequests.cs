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
    public static void dispatch(JObject jobj, VersionedModelClassNS.VersionedModelClass versionedModel) {
      var type = jobj["type"].ToString();

      if (type == "client_request") {
        ClientRequest.dispatch(jobj, versionedModel);
      } else if (type == "layer_data_response") {
        LayerDataResponse.dispatch(jobj);
      } else {
        throw new InvalidServerReqType(type);
      }
    }
  }

  internal class ClientRequest {
    public static void dispatch(JObject jobj, VersionedModelClassNS.VersionedModelClass versionedModel) {
      string clientId = jobj["client_id"].ToString();
      string requestId = jobj["client_message"]["requestId"].ToString();

      JObject clientRequest = jobj["client_message"]["request"] as JObject;

      ExternalMessageSender.RequestResponder reqResponder = new ExternalMessageSender.RequestResponder(
        requestId,
        clientId
      );

      ModelRequests.Dispatcher.dispatch(clientRequest, reqResponder, versionedModel);
    }
  }

  internal class LayerDataResponse {
    public static void dispatch(JObject jobj) {
      // @TODO
    }
    // @TODO
  }
}
#pragma warning restore 0649
