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
    public static void dispatch(JObject jobj, RequestResponder.RequestResponder reqResponder, ModelStruct.ModelStruct modelStruct) {
      GenericModelReq genericReq = jobj.ToObject<GenericModelReq>();

      if (genericReq.type == "request_model_changes") {
        ModelChangeRequest.dispatch(jobj);
      } else if (genericReq.type == "request_versioning_change") {
        VersioningChangeRequest.dispatch(jobj);
      } else if (genericReq.type == "request_model_info") {
        ModelInfoReqResponses.ModelInfoReqResponse reqResponse = ModelInfoRequest.dispatch(jobj, reqResponder, modelStruct);
        reqResponder.sendModelInfoReqResponse(reqResponse);
      } else {
        throw new InvalidModelReqType(genericReq.type);
      }
    }
  }

  internal class GenericModelReq {
    public string type;
  }

  internal class ModelChangeRequest {
    public static void dispatch(JObject jobj) {
      ModelChangeRequest changesReq = jobj.ToObject<ModelChangeRequest>();
      foreach (var changeReq in changesReq.reqs) {
        ModelChangeRequests.Dispatcher.dispatch(changeReq);
      }
    }

    public List<JObject> reqs;
  }

  internal class VersioningChangeRequest {
    public static void dispatch(JObject jobj) {
      VersioningChangeRequest versioningChangeReq = jobj.ToObject<VersioningChangeRequest>();
      ModelVersioningRequests.Dispatcher.dispatch(versioningChangeReq.req);
    }

    public JObject req;
  }

  internal class ModelInfoRequest {
    public static ModelInfoReqResponses.ModelInfoReqResponse dispatch(JObject jobj, RequestResponder.RequestResponder reqResponder, ModelStruct.ModelStruct modelStruct) {
      ModelInfoRequest modelInfoVersioningReq = jobj.ToObject<ModelInfoRequest>();
      return ModelInfoRequests.Dispatcher.dispatch(modelInfoVersioningReq.req, modelStruct);
    }

    public JObject req;
  }
}
#pragma warning restore 0649
