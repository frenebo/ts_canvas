using Newtonsoft.Json;
using System.Collections.Generic;
using Newtonsoft.Json.Linq;

// fields are assigned to from json
#pragma warning disable 0649
namespace ModelRequests {
  public class InvalidModelReqType : System.Exception {
    public InvalidModelReqType(string message) : base(message) {}
  }

  public static class Dispatcher {
    public static void dispatch(JObject jobj, ExternalMessageSender.RequestResponder reqResponder, ModelContainer.ModelContainer modelStruct) {
      string type = jobj["type"].ToString();

      if (type == "request_model_changes") {
        ModelChangeReqResponses.ModelChangeReqResponse reqResponse = ModelChangeRequest.dispatch(modelStruct, jobj);
        reqResponder.sendModelChangeReqResponse(reqResponse);
        ExternalMessageSender.DataChangedNotifier.notifyDataChanged();
      } else if (type == "request_versioning_change") {
        VersioningChangeRequest.dispatch(jobj);
      } else if (type == "request_model_info") {
        ModelInfoReqResponses.ModelInfoReqResponse reqResponse = ModelInfoRequest.dispatch(jobj, reqResponder, modelStruct);
        reqResponder.sendModelInfoReqResponse(reqResponse);
      } else {
        throw new InvalidModelReqType(type);
      }
    }
  }

  internal class ModelChangeRequest {
    public static ModelChangeReqResponses.ModelChangeReqResponse dispatch(
      ModelContainer.ModelContainer modelStruct,
      JObject jobj
      ) {
      var reqArray = jobj["reqs"] as JArray;

      foreach (var changeReq in reqArray.Children()) {
        ModelChangeRequests.Dispatcher.dispatch(modelStruct, changeReq as JObject);
      }

      return new ModelChangeReqResponses.ModelChangeReqResponse();
    }
  }

  internal class VersioningChangeRequest {
    public static void dispatch(JObject jobj) {
      JObject containedReq = jobj["req"] as JObject;
      
      ModelVersioningRequests.Dispatcher.dispatch(containedReq);
    }
  }

  internal class ModelInfoRequest {
    public static ModelInfoReqResponses.ModelInfoReqResponse dispatch(JObject jobj, ExternalMessageSender.RequestResponder reqResponder, ModelContainer.ModelContainer modelStruct) {
      JObject req = jobj["req"] as JObject;
      return ModelInfoRequests.Dispatcher.dispatch(req, modelStruct);
    }
  }
}
#pragma warning restore 0649
