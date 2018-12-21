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
      string type = jobj["type"].ToString();

      if (type == "validateEdge") {
        return ValidateEdge.dispatch(jobj);
      } else if (type == "edgesBetweenVertices") {
        return EdgesBetweenVertices.dispatch(jobj);
      } else if (type == "fileIsOpen") {
        return FileIsOpen.dispatch(jobj);
      } else if (type == "savedFileNames") {
        return SavedFileNames.dispatch(jobj);
      } else if (type == "getPortInfo") {
        return GetPortInfo.dispatch(jobj);
      } else if (type == "getLayerInfo") {
        return GetLayerInfo.dispatch(jobj);
      } else if (type == "validateValue") {
        return ValidateValue.dispatch(jobj);
      } else if (type == "compareValue") {
        return CompareValue.dispatch(jobj);
      } else if (type == "validateLayerFields") {
        return ValidateLayerFields.dispatch(jobj);
      } else if (type == "getUniqueEdgeIds") {
        return GetUniqueEdgeIds.dispatch(jobj);
      } else if (type == "getUniqueVertexIds") {
        return GetUniqueVertexIds.dispatch(jobj);
      } else if (type == "valueIsReadonly") {
        return ValueIsReadonly.dispatch(jobj);
      } else if (type == "getGraphData") {
        return GetGraphData.dispatch(jobj, modelStruct);
      } else {
        throw new InvalidInfoReqType(type);
      }
    }
  }

  internal struct ValidateEdge {
    public static ModelInfoReqResponses.ValidateEdgeResponse dispatch(JObject jobj) {
      ValidateEdge validateEdge = new ValidateEdge {
        edgeId = jobj["edgeId"].ToString(),
        sourceVertexId = jobj["sourceVertexId"].ToString(),
        sourcePortId = jobj["sourcePortId"].ToString(),
        targetVertexId = jobj["targetVertexId"].ToString(),
        targetPortId = jobj["targetPortId"].ToString()
      };
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
      List<string> vertexIds = new List<string>();
      
      foreach (var vertexId in (jobj["vertexIds"] as JArray).Children()) {
        vertexIds.Add(vertexId.ToString());
      }
      EdgesBetweenVertices edgesBetweenVertices = new EdgesBetweenVertices {
        vertexIds = vertexIds
      };
      
      throw new System.Exception("unimplemented");
    }

    public List<string> vertexIds;
  }

  internal struct FileIsOpen {
    public static ModelInfoReqResponses.FileIsOpenResponse dispatch(JObject jobj) {
      throw new System.Exception("unimplemented");
    }
  }

  internal struct SavedFileNames {
    public static ModelInfoReqResponses.SavedFileNamesResponse dispatch(JObject jobj) {
      throw new System.Exception("unimplemented");
    }
  }

  internal struct GetPortInfo {
    public static ModelInfoReqResponses.GetPortInfoResponse dispatch(JObject jobj) {
      GetPortInfo getPortInfo = new GetPortInfo {
        vertexId = jobj["vertexId"].ToString(),
        portId = jobj["portId"].ToString()
      };
      
      throw new System.Exception("unimplemented");
    }

    public string vertexId;
    public string portId;
  }

  internal struct GetLayerInfo {
    public static ModelInfoReqResponses.GetLayerInfoResponse dispatch(JObject jobj) {
      GetLayerInfo getLayerInfo = new GetLayerInfo {
        layerId = jobj["layerId"].ToString()
      };
      
      throw new System.Exception("unimplemented");
    }

    public string layerId;
  }

  internal struct ValidateValue {
    public static ModelInfoReqResponses.ValidateValueResponse dispatch(JObject jobj) {
      ValidateValue validateValue = new ValidateValue {
        layerId = jobj["layerId"].ToString(),
        valueId = jobj["valueId"].ToString(),
        newValue= jobj["newValue"].ToString()
      };
      
      throw new System.Exception("unimplemented");
    }

    public string layerId;
    public string valueId;
    public string newValue;
  }

  internal struct CompareValue {
    public static ModelInfoReqResponses.CompareValueResponse dispatch(JObject jobj) {
      CompareValue compareValue = new CompareValue {
        layerId = jobj["layerId"].ToString(),
        valueId = jobj["valueId"].ToString(),
        compareValue = jobj["compareValue"].ToString()
      };
      
      throw new System.Exception("unimplemented");
    }

    public string layerId;
    public string valueId;
    public string compareValue;
  }

  internal struct ValidateLayerFields {
    public static ModelInfoReqResponses.ValidateLayerFieldsResponse dispatch(JObject jobj) {
      Dictionary<string, string> fieldValues = new Dictionary<string, string>();

      foreach (var fieldEntry in (jobj["fieldValues"] as JObject).Properties()) {
        fieldValues[fieldEntry.Name] = fieldEntry.Value.ToString();
      }
      
      ValidateLayerFields validateLayerFields = new ValidateLayerFields {
        layerId = jobj["jobj"].ToString(),
        fieldValues = fieldValues
      };
      
      throw new System.Exception("unimplemented");
    }

    public string layerId;
    public Dictionary<string, string> fieldValues;
  }

  internal struct GetUniqueEdgeIds {
    public static ModelInfoReqResponses.GetUniqueEdgeIdsResponse dispatch(JObject jobj) {
      GetUniqueEdgeIds getUniqueEdgeIds = new GetUniqueEdgeIds {
        count = int.Parse(jobj["count"].ToString())
      };
      
      throw new System.Exception("unimplemented");
    }

    public int count;
  }

  internal struct GetUniqueVertexIds {
    public static ModelInfoReqResponses.GetUniqueEdgeIdsResponse dispatch(JObject jobj) {
      GetUniqueVertexIds getUniqueEdgeIds = new GetUniqueVertexIds {
        count = int.Parse(jobj["count"].ToString())
      };
      
      throw new System.Exception("unimplemented");
    }

    public int count;
  }

  internal struct ValueIsReadonly {
    public static ModelInfoReqResponses.ValueIsReadonlyResponse dispatch(JObject jobj) {
      ValueIsReadonly valueIsReadonly = new ValueIsReadonly {
        layerId = jobj["layerId"].ToString(),
        valueId = jobj["valueId"].ToString()
      };
      
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
