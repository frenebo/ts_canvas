using Newtonsoft.Json;
using System.Collections.Generic;
using Newtonsoft.Json.Linq;

// fields are assigned to from json
#pragma warning disable 0649
namespace ModelInfoRequests {
  public class InvalidInfoReqType : System.Exception {
    public InvalidInfoReqType(string message) : base(message) {}
  }
  public static class Dispatcher {
    public static ModelInfoReqResponses.ModelInfoReqResponse dispatch(
      JObject jobj,
      ModelStruct.ModelStruct modelStruct
    ) {
      GenericModelInfoReq genericReq = jobj.ToObject<GenericModelInfoReq>();

      if (genericReq.type == "validateEdge") {
        return ValidateEdge.dispatch(jobj);
      } else if (genericReq.type == "edgesBetweenVertices") {
        return EdgesBetweenVertices.dispatch(jobj);
      } else if (genericReq.type == "fileIsOpen") {
        return FileIsOpen.dispatch(jobj);
      } else if (genericReq.type == "savedFileNames") {
        return SavedFileNames.dispatch(jobj);
      } else if (genericReq.type == "getPortInfo") {
        return GetPortInfo.dispatch(jobj);
      } else if (genericReq.type == "getLayerInfo") {
        return GetLayerInfo.dispatch(jobj);
      } else if (genericReq.type == "validateValue") {
        return ValidateValue.dispatch(jobj);
      } else if (genericReq.type == "compareValue") {
        return CompareValue.dispatch(jobj);
      } else if (genericReq.type == "validateLayerFields") {
        return ValidateLayerFields.dispatch(jobj);
      } else if (genericReq.type == "getUniqueEdgeIds") {
        return GetUniqueEdgeIds.dispatch(jobj);
      } else if (genericReq.type == "getUniqueVertexIds") {
        return GetUniqueVertexIds.dispatch(jobj);
      } else if (genericReq.type == "valueIsReadonly") {
        return ValueIsReadonly.dispatch(jobj);
      } else if (genericReq.type == "getGraphData") {
        return GetGraphData.dispatch(jobj, modelStruct);
      } else {
        throw new InvalidInfoReqType(genericReq.type);
      }
    }
  }

  internal struct GenericModelInfoReq {
    public string type;
  }

  internal struct ValidateEdge {
    public static ModelInfoReqResponses.ValidateEdgeResponse dispatch(JObject jobj) {
      ValidateEdge validateEdge = jobj.ToObject<ValidateEdge>();
      throw new System.Exception("unimplemented");
    }

    public string edgeId;
    public string sourceVertexId;
    public string sourcePortId;
    public string targetVertexId;
    public string targetPortId;
  }

  internal struct EdgesBetweenVertices {
    public static ModelInfoReqResponses.EdgesBetweenVerticesResponse dispatch(JObject jobj) {
      EdgesBetweenVertices edgesBetweenVertices = jobj.ToObject<EdgesBetweenVertices>();
      throw new System.Exception("unimplemented");
    }

    public string[] vertexIds;
  }

  internal struct FileIsOpen {
    public static ModelInfoReqResponses.FileIsOpenResponse dispatch(JObject jobj) {
      FileIsOpen fileIsOpen = jobj.ToObject<FileIsOpen>();
      throw new System.Exception("unimplemented");
    }
  }

  internal struct SavedFileNames {
    public static ModelInfoReqResponses.SavedFileNamesResponse dispatch(JObject jobj) {
      SavedFileNames savedFileNames = jobj.ToObject<SavedFileNames>();
      throw new System.Exception("unimplemented");
    }
  }

  internal struct GetPortInfo {
    public static ModelInfoReqResponses.GetPortInfoResponse dispatch(JObject jobj) {
      GetPortInfo getPortInfo = jobj.ToObject<GetPortInfo>();
      throw new System.Exception("unimplemented");
    }

    public string vertexId;
    public string portId;
  }

  internal struct GetLayerInfo {
    public static ModelInfoReqResponses.GetLayerInfoResponse dispatch(JObject jobj) {
      GetLayerInfo getLayerInfo = jobj.ToObject<GetLayerInfo>();
      throw new System.Exception("unimplemented");
    }

    public string layerId;
  }

  internal struct ValidateValue {
    public static ModelInfoReqResponses.ValidateValueResponse dispatch(JObject jobj) {
      ValidateValue validateValue = jobj.ToObject<ValidateValue>();
      throw new System.Exception("unimplemented");
    }

    public string layerId;
    public string valueId;
    public string newValue;
  }

  internal struct CompareValue {
    public static ModelInfoReqResponses.CompareValueResponse dispatch(JObject jobj) {
      CompareValue compareValue = jobj.ToObject<CompareValue>();
      throw new System.Exception("unimplemented");
    }

    public string layerId;
    public string valueId;
    public string compareValue;
  }

  internal struct ValidateLayerFields {
    public static ModelInfoReqResponses.ValidateLayerFieldsResponse dispatch(JObject jobj) {
      ValidateLayerFields validateLayerFields = jobj.ToObject<ValidateLayerFields>();
      throw new System.Exception("unimplemented");
    }

    public string layerId;
    public Dictionary<string, string> fieldValues;
  }

  internal struct GetUniqueEdgeIds {
    public static ModelInfoReqResponses.GetUniqueEdgeIdsResponse dispatch(JObject jobj) {
      GetUniqueEdgeIds getUniqueEdgeIds = jobj.ToObject<GetUniqueEdgeIds>();
      throw new System.Exception("unimplemented");
    }

    public int count;
  }

  internal struct GetUniqueVertexIds {
    public static ModelInfoReqResponses.GetUniqueEdgeIdsResponse dispatch(JObject jobj) {
      GetUniqueVertexIds getUniqueVertexIds = jobj.ToObject<GetUniqueVertexIds>();
      throw new System.Exception("unimplemented");
    }

    public int count;
  }

  internal struct ValueIsReadonly {
    public static ModelInfoReqResponses.ValueIsReadonlyResponse dispatch(JObject jobj) {
      ValueIsReadonly valueIsReadonly = jobj.ToObject<ValueIsReadonly>();
      throw new System.Exception("unimplemented");
    }

    public string layerId;
    public string valueId;
  }

  internal struct GetGraphData {
    public static ModelInfoReqResponses.GetGraphDataResponse dispatch(JObject jobj, ModelStruct.ModelStruct modelStruct) {
      ResponseJson.GraphData graphData = ModelUtils.ModelUtils.getResponseJsonData(modelStruct);
      ModelInfoReqResponses.GetGraphDataResponse response = new ModelInfoReqResponses.GetGraphDataResponse(
        graphData
      );
      return response;
    }
  }
}
#pragma warning restore 0649
