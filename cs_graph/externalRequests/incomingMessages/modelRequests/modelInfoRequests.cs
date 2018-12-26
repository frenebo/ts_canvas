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
      VersionedModelClassNS.VersionedModelClass versionedModel
    ) {
      string type = jobj["type"].ToString();

      if (type == "validateEdge") {
        return ValidateEdgeReq.dispatch(jobj);
      } else if (type == "edgesBetweenVertices") {
        return EdgesBetweenVerticesReq.dispatch(versionedModel, jobj);
      } else if (type == "fileIsOpen") {
        return FileIsOpenReq.dispatch(jobj);
      } else if (type == "savedFileNames") {
        return SavedFileNamesReq.dispatch(jobj);
      } else if (type == "getPortInfo") {
        return GetPortInfoReq.dispatch(jobj);
      } else if (type == "getLayerInfo") {
        return GetLayerInfoReq.dispatch(jobj);
      } else if (type == "validateValue") {
        return ValidateValueReq.dispatch(jobj);
      } else if (type == "compareValue") {
        return CompareValueReq.dispatch(jobj);
      } else if (type == "validateLayerFields") {
        return ValidateLayerFieldsReq.dispatch(jobj);
      } else if (type == "getUniqueEdgeIds") {
        return GetUniqueEdgeIdsReq.dispatch(versionedModel, jobj);
      } else if (type == "getUniqueVertexIds") {
        return GetUniqueVertexIdsReq.dispatch(versionedModel, jobj);
      } else if (type == "valueIsReadonly") {
        return ValueIsReadonlyReq.dispatch(jobj);
      } else if (type == "getGraphData") {
        return GetGraphDataReq.dispatch(versionedModel, jobj);
      } else {
        throw new InvalidInfoReqType(type);
      }
    }
  }

  internal struct ValidateEdgeReq {
    public static ModelInfoReqResponses.ValidateEdgeResponse dispatch(JObject jobj) {
      ValidateEdgeReq validateEdge = new ValidateEdgeReq {
        edgeId = jobj["edgeId"].ToString(),
        sourceVertexId = jobj["sourceVertexId"].ToString(),
        sourcePortId = jobj["sourcePortId"].ToString(),
        targetVertexId = jobj["targetVertexId"].ToString(),
        targetPortId = jobj["targetPortId"].ToString()
      };
      throw new System.Exception("ValidateEdge: unimplemented");
    }

    public string edgeId;
    public string sourceVertexId;
    public string sourcePortId;
    public string targetVertexId;
    public string targetPortId;
  }

  internal struct EdgesBetweenVerticesReq {
    public static ModelInfoReqResponses.EdgesBetweenVerticesResponse dispatch(
      VersionedModelClassNS.VersionedModelClass versionedModel,
      JObject jobj
    ) {
      var modelContainer = versionedModel.getCurrent();
      List<string> vertexIds = new List<string>();

      foreach (var vertexId in (jobj["vertexIds"] as JArray).Children()) {
        vertexIds.Add(vertexId.ToString());
      }
      EdgesBetweenVerticesReq edgesBetweenVertices = new EdgesBetweenVerticesReq {
        vertexIds = vertexIds
      };

      List<string> edgeIds = ModelUtilsNS.ModelUtils.getEdgesBetweenVertices(
        modelContainer,
        edgesBetweenVertices.vertexIds
      );

      var edges = new Dictionary<string, ResponseJson.EdgeData>();

      foreach (string edgeId in edgeIds) {
        GraphUtilsNS.GraphUtils.getEdgeJsonData(modelContainer.graph.edges[edgeId]);
        edges[edgeId] = GraphUtilsNS.GraphUtils.getEdgeJsonData(modelContainer.graph.edges[edgeId]);;
      }

      return new ModelInfoReqResponses.EdgesBetweenVerticesResponseVerticesExist(edges);
    }

    public List<string> vertexIds;
  }

  internal struct FileIsOpenReq {
    public static ModelInfoReqResponses.FileIsOpenResponse dispatch(JObject jobj) {
      var response = new ModelInfoReqResponses.FileIsOpenResponseNotOpen();

      // @TODO make things saveable

      return response;
    }
  }

  internal struct SavedFileNamesReq {
    public static ModelInfoReqResponses.SavedFileNamesResponse dispatch(JObject jobj) {
      throw new System.Exception("SavedFileNames: unimplemented");
    }
  }

  internal struct GetPortInfoReq {
    public static ModelInfoReqResponses.GetPortInfoResponse dispatch(JObject jobj) {
      GetPortInfoReq getPortInfo = new GetPortInfoReq {
        vertexId = jobj["vertexId"].ToString(),
        portId = jobj["portId"].ToString()
      };

      throw new System.Exception("GetPortInfo: unimplemented");
    }

    public string vertexId;
    public string portId;
  }

  internal struct GetLayerInfoReq {
    public static ModelInfoReqResponses.GetLayerInfoResponse dispatch(JObject jobj) {
      GetLayerInfoReq getLayerInfo = new GetLayerInfoReq {
        layerId = jobj["layerId"].ToString()
      };

      throw new System.Exception("GetLayerInfo: unimplemented");
    }

    public string layerId;
  }

  internal struct ValidateValueReq {
    public static ModelInfoReqResponses.ValidateValueResponse dispatch(JObject jobj) {
      ValidateValueReq validateValue = new ValidateValueReq {
        layerId = jobj["layerId"].ToString(),
        valueId = jobj["valueId"].ToString(),
        newValue= jobj["newValue"].ToString()
      };

      throw new System.Exception("ValidateValue: unimplemented");
    }

    public string layerId;
    public string valueId;
    public string newValue;
  }

  internal struct CompareValueReq {
    public static ModelInfoReqResponses.CompareValueResponse dispatch(JObject jobj) {
      CompareValueReq compareValue = new CompareValueReq {
        layerId = jobj["layerId"].ToString(),
        valueId = jobj["valueId"].ToString(),
        compareValue = jobj["compareValue"].ToString()
      };

      throw new System.Exception("CompareValue: unimplemented");
    }

    public string layerId;
    public string valueId;
    public string compareValue;
  }

  internal struct ValidateLayerFieldsReq {
    public static ModelInfoReqResponses.ValidateLayerFieldsResponse dispatch(JObject jobj) {
      Dictionary<string, string> fieldValues = new Dictionary<string, string>();

      foreach (var fieldEntry in (jobj["fieldValues"] as JObject).Properties()) {
        fieldValues[fieldEntry.Name] = fieldEntry.Value.ToString();
      }

      ValidateLayerFieldsReq validateLayerFields = new ValidateLayerFieldsReq {
        layerId = jobj["jobj"].ToString(),
        fieldValues = fieldValues
      };

      throw new System.Exception("ValidateLayerFields: unimplemented");
    }

    public string layerId;
    public Dictionary<string, string> fieldValues;
  }

  internal struct GetUniqueEdgeIdsReq {
    public static ModelInfoReqResponses.GetUniqueEdgeIdsResponse dispatch(
      VersionedModelClassNS.VersionedModelClass versionedModel,
      JObject jobj
    ) {
      var modelContainer = versionedModel.getCurrent();
      GetUniqueEdgeIdsReq getUniqueEdgeIdsReq = new GetUniqueEdgeIdsReq {
        count = int.Parse(jobj["count"].ToString())
      };

      List<string> edgesIds = ModelUtilsNS.ModelUtils.getUniqueEdgeIds(modelContainer, getUniqueEdgeIdsReq.count);

      return new ModelInfoReqResponses.GetUniqueEdgeIdsResponse(edgesIds);
    }

    public int count;
  }

  internal struct GetUniqueVertexIdsReq {
    public static ModelInfoReqResponses.GetUniqueVertexIdsResponse dispatch(
      VersionedModelClassNS.VersionedModelClass versionedModel,
      JObject jobj
    ) {
      var modelContainer = versionedModel.getCurrent();
      GetUniqueVertexIdsReq getUniqueVertexIds = new GetUniqueVertexIdsReq {
        count = int.Parse(jobj["count"].ToString())
      };

      List<string> vertexIds = ModelUtilsNS.ModelUtils.getUniqueVertexIds(modelContainer, getUniqueVertexIds.count);

      return new ModelInfoReqResponses.GetUniqueVertexIdsResponse(vertexIds);
    }

    public int count;
  }

  internal struct ValueIsReadonlyReq {
    public static ModelInfoReqResponses.ValueIsReadonlyResponse dispatch(JObject jobj) {
      ValueIsReadonlyReq valueIsReadonly = new ValueIsReadonlyReq {
        layerId = jobj["layerId"].ToString(),
        valueId = jobj["valueId"].ToString()
      };

      throw new System.Exception("ValueIsReadonly: unimplemented");
    }

    public string layerId;
    public string valueId;
  }

  internal struct GetGraphDataReq {
    public static ModelInfoReqResponses.GetGraphDataResponse dispatch(
      VersionedModelClassNS.VersionedModelClass versionedModel,
      JObject jobj
    ) {
      var modelContainer = versionedModel.getCurrent();
      ResponseJson.GraphData graphData = ModelUtilsNS.ModelUtils.getResponseJsonData(modelContainer);

      ModelInfoReqResponses.GetGraphDataResponse response = new ModelInfoReqResponses.GetGraphDataResponse(graphData);

      return response;
    }
  }
}
#pragma warning restore 0649
