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
    public static void dispatch(JObject jobj, ExternalMessageSender.RequestResponder reqResponder, VersionedModelClassNS.VersionedModelClass versionedModel) {
      string type = jobj["type"].ToString();

      if (type == "request_model_changes") {
        versionedModel.recordModel();
        ModelChangeReqResponseNS.ModelChangeReqResponse reqResponse = ModelChangeRequest.dispatch(versionedModel.getCurrent(), jobj);
        
        reqResponder.sendModelChangeReqResponse(reqResponse);
        ExternalMessageSender.DataChangedNotifier.notifyDataChanged();
      } else if (type == "request_versioning_change") {
        ModelVersioningReqResponses.ModelVersioningReqResponse reqResponse = VersioningChangeRequest.dispatch(jobj, versionedModel);
        
        reqResponder.sendVersioningChangeReqResponse(reqResponse);
        ExternalMessageSender.DataChangedNotifier.notifyDataChanged();
      } else if (type == "request_model_info") {
        ModelInfoReqResponses.ModelInfoReqResponse reqResponse = ModelInfoRequest.dispatch(jobj, reqResponder, versionedModel);
        reqResponder.sendModelInfoReqResponse(reqResponse);
      } else {
        throw new InvalidModelReqType(type);
      }
    }
  }

  internal static class ModelChangeRequest {
    public static ModelChangeReqResponseNS.ModelChangeReqResponse dispatch(
      ModelClassNS.ModelClass modelStruct,
      JObject jobj
      ) {
      var reqArray = jobj["reqs"] as JArray;

      foreach (var changeReq in reqArray.Children()) {
        ModelChangeRequests.Dispatcher.dispatch(modelStruct, changeReq as JObject);
      }

      return new ModelChangeReqResponseNS.ModelChangeReqResponse();
    }
  }

  internal static class VersioningChangeRequest {
    public static ModelVersioningReqResponses.ModelVersioningReqResponse dispatch(JObject jobj, VersionedModelClassNS.VersionedModelClass versionedModel) {
      JObject containedReq = jobj["req"] as JObject;
      
      return ModelVersioningRequests.Dispatcher.dispatch(containedReq, versionedModel);
    }
  }

  internal static class ModelInfoRequest {
    public static ModelInfoReqResponses.ModelInfoReqResponse dispatch(JObject jobj, ExternalMessageSender.RequestResponder reqResponder,VersionedModelClassNS.VersionedModelClass versionedModel) {
      JObject req = jobj["req"] as JObject;
      return ModelInfoRequests.Dispatcher.dispatch(req, versionedModel);
    }
  }
}
#pragma warning restore 0649
