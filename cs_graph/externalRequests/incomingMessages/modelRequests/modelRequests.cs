using Newtonsoft.Json;
using System.Collections.Generic;

// fields are assigned to from json
#pragma warning disable 0649
namespace ModelRequests {
  public class InvalidModelReqType : System.Exception {
    public InvalidModelReqType(string message) : base(message) {}
  }

  public static class Dispatcher {
    public static void dispatch(string str, RequestResponder.RequestResponder reqResponder, ModelStruct.ModelStruct modelStruct) {
      GenericModelReq genericReq = JsonConvert.DeserializeObject<GenericModelReq>(str);

      if (genericReq.type == "request_model_changes") {
        ModelChangeRequest.dispatch(str);
      } else if (genericReq.type == "request_versioning_change") {
        VersioningChangeRequest.dispatch(str);
      } else if (genericReq.type == "request_model_info") {
        ModelInfoRequest.dispatch(str, reqResponder, modelStruct);
      } else {
        throw new InvalidModelReqType(genericReq.type);
      }
    }
  }

  internal class GenericModelReq {
    public string type;
  }

  internal class ModelChangeRequest {
    public static void dispatch(string str) {
      ModelChangeRequest changesReq = JsonConvert.DeserializeObject<ModelChangeRequest>(str);
      foreach (string changeReq in changesReq.reqs) {
        ModelChangeRequests.Dispatcher.dispatch(changeReq);
      }
    }

    [JsonConverter(typeof(JsonUtils.ConvertObjectArrayToStringArray))]
    public List<string> reqs;
  }

  internal class VersioningChangeRequest {
    public static void dispatch(string str) {
      VersioningChangeRequest versioningChangeReq = JsonConvert.DeserializeObject<VersioningChangeRequest>(str);
      ModelVersioningRequests.Dispatcher.dispatch(versioningChangeReq.req);
    }

    [JsonConverter(typeof(JsonUtils.ConvertObjectToString))]
    public string req;
  }

  internal class ModelInfoRequest {
    public static void dispatch(string str, RequestResponder.RequestResponder reqResponder, ModelStruct.ModelStruct modelStruct) {
      ModelInfoRequest modelInfoVersioningReq = JsonConvert.DeserializeObject<ModelInfoRequest>(str);
      ModelInfoRequests.Dispatcher.dispatch(modelInfoVersioningReq.req, reqResponder, modelStruct);
    }

    [JsonConverter(typeof(JsonUtils.ConvertObjectToString))]
    public string req;
  }
}
#pragma warning restore 0649
