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
        return ValidateEdgeReq.dispatch(versionedModel, jobj);
      } else if (type == "edgesBetweenVertices") {
        return EdgesBetweenVerticesReq.dispatch(versionedModel, jobj);
      } else if (type == "fileIsOpen") {
        return FileIsOpenReq.dispatch(versionedModel, jobj);
      } else if (type == "savedFileNames") {
        return SavedFileNamesReq.dispatch(versionedModel, jobj);
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
        return ValueIsReadonlyReq.dispatch(versionedModel, jobj);
      } else if (type == "getGraphData") {
        return GetGraphDataReq.dispatch(versionedModel, jobj);
      } else {
        throw new InvalidInfoReqType(type);
      }
    }
  }

  internal static class ValidateEdgeReq {
    public static ModelInfoReqResponses.ValidateEdgeResponse dispatch(
      VersionedModelClassNS.VersionedModelClass versionedModel,
      JObject jobj
    ) {
      string edgeId = jobj["edgeId"].ToString();
      string sourceVertexId = jobj["sourceVertexId"].ToString();
      string sourcePortId = jobj["sourcePortId"].ToString();
      string targetVertexId = jobj["targetVertexId"].ToString();
      string targetPortId = jobj["targetPortId"].ToString();

      string possibleProblemReason = ModelUtilsNS.ModelUtils.validateEdge(
        versionedModel.getCurrent(),
        edgeId,
        sourceVertexId,
        sourcePortId,
        targetVertexId,
        targetPortId
      );

      if (possibleProblemReason == null) {
        return new ModelInfoReqResponses.ValidateEdgeResponseValid();
      } else {
        return new ModelInfoReqResponses.ValidateEdgeResponseInvalid(possibleProblemReason);
      }
    }
  }

  internal static class EdgesBetweenVerticesReq {
    public static ModelInfoReqResponses.EdgesBetweenVerticesResponse dispatch(
      VersionedModelClassNS.VersionedModelClass versionedModel,
      JObject jobj
    ) {
      var modelContainer = versionedModel.getCurrent();
      List<string> vertexIds = new List<string>();

      foreach (var vertexId in (jobj["vertexIds"] as JArray).Children()) {
        vertexIds.Add(vertexId.ToString());
      }

      List<string> edgeIds = ModelUtilsNS.ModelUtils.getEdgesBetweenVertices(
        modelContainer,
        vertexIds
      );

      var edges = new Dictionary<string, ResponseJson.EdgeData>();

      foreach (string edgeId in edgeIds) {
        GraphUtilsNS.GraphUtils.getEdgeJsonData(modelContainer.graph.edges[edgeId]);
        edges[edgeId] = GraphUtilsNS.GraphUtils.getEdgeJsonData(modelContainer.graph.edges[edgeId]);;
      }

      return new ModelInfoReqResponses.EdgesBetweenVerticesResponseVerticesExist(edges);
    }
  }

  internal static class FileIsOpenReq {
    public static ModelInfoReqResponses.FileIsOpenResponse dispatch(
      VersionedModelClassNS.VersionedModelClass versionedModel,
      JObject jobj
    ) {
      if (versionedModel.isFileCurrentlyOpen()) {
        return new ModelInfoReqResponses.FileIsOpenResponseOpen(versionedModel.unsafeGetCurrentFileName(), versionedModel.progressIsSaved());
      } else {
        return new ModelInfoReqResponses.FileIsOpenResponseNotOpen();
      }
    }
  }

  internal static class SavedFileNamesReq {
    public static ModelInfoReqResponses.SavedFileNamesResponse dispatch(
      VersionedModelClassNS.VersionedModelClass versionedModel,
      JObject jobj
    ) {
      return new ModelInfoReqResponses.SavedFileNamesResponse(versionedModel.getSavedFileNames());
    }
  }

  internal static class GetPortInfoReq {
    public static ModelInfoReqResponses.GetPortInfoResponse dispatch(JObject jobj) {
      string vertexId = jobj["vertexId"].ToString();
      string portId = jobj["portId"].ToString();

      throw new System.Exception("GetPortInfo: unimplemented");
    }
  }

  internal static class GetLayerInfoReq {
    public static ModelInfoReqResponses.GetLayerInfoResponse dispatch(JObject jobj) {
      string layerId = jobj["layerId"].ToString();

      throw new System.Exception("GetLayerInfo: unimplemented");
    }
  }

  internal static class ValidateValueReq {
    public static ModelInfoReqResponses.ValidateValueResponse dispatch(JObject jobj) {
      string layerId = jobj["layerId"].ToString();
      string valueId = jobj["valueId"].ToString();
      string newValue= jobj["newValue"].ToString();

      throw new System.Exception("ValidateValue: unimplemented");
    }
  }

  internal static class CompareValueReq {
    public static ModelInfoReqResponses.CompareValueResponse dispatch(JObject jobj) {
      string layerId = jobj["layerId"].ToString();
      string valueId = jobj["valueId"].ToString();
      string compareValue = jobj["compareValue"].ToString();

      throw new System.Exception("CompareValue: unimplemented");
    }
  }

  internal static class ValidateLayerFieldsReq {
    public static ModelInfoReqResponses.ValidateLayerFieldsResponse dispatch(JObject jobj) {
      Dictionary<string, string> fieldValues = new Dictionary<string, string>();

      foreach (var fieldEntry in (jobj["fieldValues"] as JObject).Properties()) {
        fieldValues[fieldEntry.Name] = fieldEntry.Value.ToString();
      }

      string layerId = jobj["layerId"].ToString();

      throw new System.Exception("ValidateLayerFields: unimplemented");
    }
  }

  internal static class GetUniqueEdgeIdsReq {
    public static ModelInfoReqResponses.GetUniqueEdgeIdsResponse dispatch(
      VersionedModelClassNS.VersionedModelClass versionedModel,
      JObject jobj
    ) {
      var modelContainer = versionedModel.getCurrent();
      
      int count = int.Parse(jobj["count"].ToString());

      List<string> edgesIds = ModelUtilsNS.ModelUtils.getUniqueEdgeIds(modelContainer, count);

      return new ModelInfoReqResponses.GetUniqueEdgeIdsResponse(edgesIds);
    }
  }

  internal static class GetUniqueVertexIdsReq {
    public static ModelInfoReqResponses.GetUniqueVertexIdsResponse dispatch(
      VersionedModelClassNS.VersionedModelClass versionedModel,
      JObject jobj
    ) {
      var modelContainer = versionedModel.getCurrent();
      int count = int.Parse(jobj["count"].ToString());

      List<string> vertexIds = ModelUtilsNS.ModelUtils.getUniqueVertexIds(modelContainer, count);

      return new ModelInfoReqResponses.GetUniqueVertexIdsResponse(vertexIds);
    }
  }

  internal static class ValueIsReadonlyReq {
    public static ModelInfoReqResponses.ValueIsReadonlyResponse dispatch(
      VersionedModelClassNS.VersionedModelClass versionedModel,
      JObject jobj
    ) {
      string layerId = jobj["layerId"].ToString();
      string valueId = jobj["valueId"].ToString();

      if (ModelUtilsNS.ModelUtils.isValueReadonly(versionedModel.getCurrent(), layerId, valueId)) {

      }

      throw new System.Exception("ValueIsReadonly: unimplemented");
    }
  }

  internal static class GetGraphDataReq {
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
