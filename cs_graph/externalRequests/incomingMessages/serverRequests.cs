using Newtonsoft.Json;
using System.Collections.Generic;

// fields are assigned to from json
#pragma warning disable 0649
namespace ServerRequests {
  public static class Dispatcher {
    public static void dispatch(string str) {
      GenericServerReq genericReq = GenericServerReq.fromJson(str);

      if (genericReq.type == "request_model_changes") {
        ModelChangeServerRequest.dispatch(str);
      } else if (genericReq.type == "request_versioning_change") {
        VersioningChangeServerRequest.dispatch(str);
      } else if (genericReq.type == "request_model_info") {
        ModelInfoServerRequest.dispatch(str);
      }
    }
  }

  internal class GenericServerReq {
    public static GenericServerReq fromJson(string str) {
      return JsonConvert.DeserializeObject<GenericServerReq>(str);
    }

    public string type;
  }

  internal class ModelChangeServerRequest {
    public static void dispatch(string str) {
      ModelChangeServerRequest changesReq = JsonConvert.DeserializeObject<ModelChangeServerRequest>(str);
      foreach (string changeReq in changesReq.reqs) {
        ModelChangeRequests.Dispatcher.dispatch(changeReq);
      }
    }

    [JsonConverter(typeof(JsonUtils.ConvertObjectArrayToStringArray))]
    public List<string> reqs;
  }

  internal class VersioningChangeServerRequest {
    public static void dispatch(string str) {
      VersioningChangeServerRequest versioningChangeReq = JsonConvert.DeserializeObject<VersioningChangeServerRequest>(str);
      ModelVersioningRequests.Dispatcher.dispatch(versioningChangeReq.req);
    }

    [JsonConverter(typeof(JsonUtils.ConvertObjectToString))]
    public string req;
  }

  internal class ModelInfoServerRequest {
    public static void dispatch(string str) {
      ModelInfoServerRequest modelInfoVersioningReq = JsonConvert.DeserializeObject<ModelInfoServerRequest>(str);
      ModelInfoRequests.Dispatcher.dispatch(modelInfoVersioningReq.req);
    }

    [JsonConverter(typeof(JsonUtils.ConvertObjectToString))]
    public string req;
  }
}
#pragma warning restore 0649
