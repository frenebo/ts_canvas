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
    public static void dispatch(JObject jobj, ModelContainer.ModelContainer modelStruct) {
      var parseWatch = System.Diagnostics.Stopwatch.StartNew();

      var type = jobj["type"].ToString();
      
      parseWatch.Stop();
      var parseElapsedMs = parseWatch.ElapsedMilliseconds;
      System.Console.Error.WriteLine("To generic req time: " + parseElapsedMs.ToString());

      if (type == "client_request") {
        ClientRequest.dispatch(jobj, modelStruct);
      } else if (type == "layer_data_response") {
        LayerDataResponse.dispatch(jobj);
      } else {
        throw new InvalidServerReqType(type);
      }
    }
  }


  internal class ClientRequest {
    public static void dispatch(JObject jobj, ModelContainer.ModelContainer modelStruct) {
      string clientId = jobj["client_id"].ToString();
      string requestId = jobj["client_message"]["requestId"].ToString();

      JObject clientRequest = jobj["client_message"]["request"] as JObject;
      
      ExternalMessageSender.RequestResponder reqResponder = new ExternalMessageSender.RequestResponder(
        modelStruct,
        requestId,
        clientId
      );
      
      ModelRequests.Dispatcher.dispatch(clientRequest, reqResponder, modelStruct);
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
