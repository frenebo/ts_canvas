using Newtonsoft.Json;
using System.Collections.Generic;

// fields are assigned to from json
#pragma warning disable 0649
namespace ModelInfoRequests {
  public class InvalidInfoReqType : System.Exception {
    public InvalidInfoReqType(string message) : base(message) {}
  }
  public static class Dispatcher {
    public static void dispatch(
      string str,
      RequestResponder.RequestResponder reqResponder,
      ModelStruct.ModelStruct modelStruct
    ) {
      GenericModelInfoReq genericReq = JsonConvert.DeserializeObject<GenericModelInfoReq>(str);

      if (genericReq.type == "validateEdge") {
        ValidateEdge.dispatch(str, reqResponder);
      } else if (genericReq.type == "edgesBetweenVertices") {
        EdgesBetweenVertices.dispatch(str, reqResponder);
      } else if (genericReq.type == "fileIsOpen") {
        FileIsOpen.dispatch(str, reqResponder);
      } else if (genericReq.type == "savedFileNames") {
        SavedFileNames.dispatch(str, reqResponder);
      } else if (genericReq.type == "getPortInfo") {
        GetPortInfo.dispatch(str, reqResponder);
      } else if (genericReq.type == "getLayerInfo") {
        GetLayerInfo.dispatch(str, reqResponder);
      } else if (genericReq.type == "validateValue") {
        ValidateValue.dispatch(str, reqResponder);
      } else if (genericReq.type == "compareValue") {
        CompareValue.dispatch(str, reqResponder);
      } else if (genericReq.type == "validateLayerFields") {
        ValidateLayerFields.dispatch(str, reqResponder);
      } else if (genericReq.type == "getUniqueEdgeIds") {
        GetUniqueEdgeIds.dispatch(str, reqResponder);
      } else if (genericReq.type == "getUniqueVertexIds") {
        GetUniqueVertexIds.dispatch(str, reqResponder);
      } else if (genericReq.type == "valueIsReadonly") {
        ValueIsReadonly.dispatch(str, reqResponder);
      } else if (genericReq.type == "getGraphData") {
        GetGraphData.dispatch(str, reqResponder, modelStruct);
      } else {
        throw new InvalidInfoReqType(genericReq.type);
      }
    }
  }

  internal struct GenericModelInfoReq {
    public string type;
  }

  internal struct ValidateEdge {
    public static void dispatch(string str, RequestResponder.RequestResponder reqResponder) {
      ValidateEdge validateEdge = JsonConvert.DeserializeObject<ValidateEdge>(str);
    }

    public string edgeId;
    public string sourceVertexId;
    public string sourcePortId;
    public string targetVertexId;
    public string targetPortId;
  }

  internal struct EdgesBetweenVertices {
    public static void dispatch(string str, RequestResponder.RequestResponder reqResponder) {
      EdgesBetweenVertices edgesBetweenVertices = JsonConvert.DeserializeObject<EdgesBetweenVertices>(str);
    }

    public string[] vertexIds;
  }

  internal struct FileIsOpen {
    public static void dispatch(string str, RequestResponder.RequestResponder reqResponder) {
      FileIsOpen fileIsOpen = JsonConvert.DeserializeObject<FileIsOpen>(str);
    }
  }

  internal struct SavedFileNames {
    public static void dispatch(string str, RequestResponder.RequestResponder reqResponder) {
      SavedFileNames savedFileNames = JsonConvert.DeserializeObject<SavedFileNames>(str);
    }
  }

  internal struct GetPortInfo {
    public static void dispatch(string str, RequestResponder.RequestResponder reqResponder) {
      GetPortInfo getPortInfo = JsonConvert.DeserializeObject<GetPortInfo>(str);
    }

    public string vertexId;
    public string portId;
  }

  internal struct GetLayerInfo {
    public static void dispatch(string str, RequestResponder.RequestResponder reqResponder) {
      GetLayerInfo getLayerInfo = JsonConvert.DeserializeObject<GetLayerInfo>(str);
    }

    public string layerId;
  }

  internal struct ValidateValue {
    public static void dispatch(string str, RequestResponder.RequestResponder reqResponder) {
      ValidateValue validateValue = JsonConvert.DeserializeObject<ValidateValue>(str);
    }

    public string layerId;
    public string valueId;
    public string newValue;
  }

  internal struct CompareValue {
    public static void dispatch(string str, RequestResponder.RequestResponder reqResponder) {
      CompareValue compareValue = JsonConvert.DeserializeObject<CompareValue>(str);
    }

    public string layerId;
    public string valueId;
    public string compareValue;
  }

  internal struct ValidateLayerFields {
    public static void dispatch(string str, RequestResponder.RequestResponder reqResponder) {
      ValidateLayerFields validateLayerFields = JsonConvert.DeserializeObject<ValidateLayerFields>(str);
    }

    public string layerId;
    public Dictionary<string, string> fieldValues;
  }

  internal struct GetUniqueEdgeIds {
    public static void dispatch(string str, RequestResponder.RequestResponder reqResponder) {
      GetUniqueEdgeIds getUniqueEdgeIds = JsonConvert.DeserializeObject<GetUniqueEdgeIds>(str);
    }

    public int count;
  }

  internal struct GetUniqueVertexIds {
    public static void dispatch(string str, RequestResponder.RequestResponder reqResponder) {
      GetUniqueVertexIds getUniqueVertexIds = JsonConvert.DeserializeObject<GetUniqueVertexIds>(str);
    }

    public int count;
  }

  internal struct ValueIsReadonly {
    public static void dispatch(string str, RequestResponder.RequestResponder reqResponder) {
      ValueIsReadonly valueIsReadonly = JsonConvert.DeserializeObject<ValueIsReadonly>(str);
    }

    public string layerId;
    public string valueId;
  }

  internal struct GetGraphData {
    public static void dispatch(string str, RequestResponder.RequestResponder reqResponder, ModelStruct.ModelStruct modelStruct) {
      ResponseJson.GraphData graphData = ModelUtils.ModelUtils.getResponseJsonData(modelStruct);
      ModelInfoReqResponses.GetGraphDataResponse response = new ModelInfoReqResponses.GetGraphDataResponse(
        graphData
      );
      reqResponder.sendModelInfoReqResponse(response);
    }
  }
}
#pragma warning restore 0649
