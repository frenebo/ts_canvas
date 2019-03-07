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
        return GetPortInfoReq.dispatch(versionedModel, jobj);
      } else if (type == "getLayerInfo") {
        return GetLayerInfoReq.dispatch(versionedModel, jobj);
      } else if (type == "validateValue") {
        return ValidateValueReq.dispatch(versionedModel, jobj);
      } else if (type == "compareValue") {
        return CompareValueReq.dispatch(versionedModel, jobj);
      } else if (type == "validateLayerFields") {
        return ValidateLayerFieldsReq.dispatch(versionedModel, jobj);
      } else if (type == "getUniqueEdgeIds") {
        return GetUniqueEdgeIdsReq.dispatch(versionedModel, jobj);
      } else if (type == "getUniqueVertexIds") {
        return GetUniqueVertexIdsReq.dispatch(versionedModel, jobj);
      } else if (type == "valueIsReadonly") {
        return ValueIsReadonlyReq.dispatch(versionedModel, jobj);
      } else if (type == "getGraphData") {
        return GetGraphDataReq.dispatch(versionedModel, jobj);
      } else if (type == "getListOfLayers") {
        return GetListOfLayersReq.dispatch(versionedModel);
      } else {
        throw new InvalidInfoReqType(type);
      }
    }
  }

  internal class GetListOfLayersReq {
    public static ModelInfoReqResponses.GetListOfLayersResponse dispatch(
      VersionedModelClassNS.VersionedModelClass versionedModel
    ) {
      return new ModelInfoReqResponses.GetListOfLayersResponse(
        new List<ModelInfoReqResponses.GetListOfLayersResponse.LayerListElement> {
          new ModelInfoReqResponses.GetListOfLayersResponse.LayerListElement(
            "Unimplemented server feature",
            "Not implemented"
          )
        }
      );
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
    public static ModelInfoReqResponses.GetPortInfoResponse dispatch(
      VersionedModelClassNS.VersionedModelClass versionedModel,
      JObject jobj
    ) {
      string vertexId = jobj["vertexId"].ToString();
      string portId = jobj["portId"].ToString();

      if (!versionedModel.getCurrent().graph.vertices.ContainsKey(vertexId)) {
        return new ModelInfoReqResponses.GetPortInfoResponseCouldNotFindPort();
      }
      if (!versionedModel.getCurrent().graph.vertices[vertexId].ports.ContainsKey(portId)) {
        return new ModelInfoReqResponses.GetPortInfoResponseCouldNotFindPort();        
      }
      Layers.Layer layer = versionedModel.getCurrent().layerDict.layers[vertexId];

      string valueName = layer.getValueNameOfPort(portId);
      string fieldValue = layer.getValueString(valueName);

      return new ModelInfoReqResponses.GetPortInfoResponseCouldFindPort(fieldValue);
    }
  }

  internal static class GetLayerInfoReq {
    public static ModelInfoReqResponses.GetLayerInfoResponse dispatch(
      VersionedModelClassNS.VersionedModelClass versionedModel,
      JObject jobj
    ) {
      string layerId = jobj["layerId"].ToString();

      if (!versionedModel.getCurrent().layerDict.layers.ContainsKey(layerId)) {
        return new ModelInfoReqResponses.GetLayerInfoResponseLayerDoesNotExist();
      }

      ResponseJson.LayerData layerData = ModelUtilsNS.ModelUtils.getLayerJsonData(versionedModel.getCurrent(), layerId);

      return new ModelInfoReqResponses.GetLayerInfoResponseLayerExists(layerData);
    }
  }

  internal static class ValidateValueReq {
    public static ModelInfoReqResponses.ValidateValueResponse dispatch(
      VersionedModelClassNS.VersionedModelClass versionedModel,
      JObject jobj
    ) {
      string layerId = jobj["layerId"].ToString();
      string valueId = jobj["valueId"].ToString();
      string newValue= jobj["newValue"].ToString();

      if (!versionedModel.getCurrent().layerDict.layers.ContainsKey(layerId)) {
        return new ModelInfoReqResponses.ValidateValueResponseLayerNonexistentError();
      }
      if (!versionedModel.getCurrent().layerDict.layers[layerId].getValueNames().Contains(valueId)) {
        return new ModelInfoReqResponses.ValidateValueResponseFieldNonexistError(valueId);
      }
      if (versionedModel.getCurrent().layerDict.layers[layerId].getValueIsReadonly(valueId)) {
        return new ModelInfoReqResponses.ValidateValueResponseNoError("Field is read-only");
      }

      // string may be null
      string validated = ModelUtilsNS.ModelUtils.validateFieldValue(
        versionedModel.getCurrent(),
        layerId,
        valueId,
        newValue
      );

      return new ModelInfoReqResponses.ValidateValueResponseNoError(validated);
    }
  }

  internal static class CompareValueReq {
    public static ModelInfoReqResponses.CompareValueResponse dispatch(
      VersionedModelClassNS.VersionedModelClass versionedModel,
      JObject jobj
    ) {
      string layerId = jobj["layerId"].ToString();
      string valueId = jobj["valueId"].ToString();
      string compareValue = jobj["compareValue"].ToString();

      if (!versionedModel.getCurrent().layerDict.layers.ContainsKey(layerId)) {
        return new ModelInfoReqResponses.CompareValueResponseLayerNonexistentError();
      }
      if (!versionedModel.getCurrent().layerDict.layers[layerId].getValueNames().Contains(valueId)) {
        return new ModelInfoReqResponses.CompareValueResponseFieldNonexistentError();
      }

      bool isEqual = ModelUtilsNS.ModelUtils.compareFieldValue(
        versionedModel.getCurrent(),
        layerId,
        valueId,
        compareValue
      );

      return new ModelInfoReqResponses.CompareValueResponseNoError(isEqual);
    }
  }

  internal static class ValidateLayerFieldsReq {
    public static ModelInfoReqResponses.ValidateLayerFieldsResponse dispatch(
      VersionedModelClassNS.VersionedModelClass versionedModel,
      JObject jobj
    ) {
      Dictionary<string, string> fieldValues = new Dictionary<string, string>();

      foreach (var fieldEntry in (jobj["fieldValues"] as JObject).Properties()) {
        fieldValues[fieldEntry.Name] = fieldEntry.Value.ToString();
      }

      string layerId = jobj["layerId"].ToString();

      if (!versionedModel.getCurrent().layerDict.layers.ContainsKey(layerId)) {
        return new ModelInfoReqResponses.ValidateLayerFieldsResponseLayerNonexistentError();
      }
      Layers.Layer layer = versionedModel.getCurrent().layerDict.layers[layerId];
      foreach (var fieldEntry in fieldValues) {
        if (!layer.getValueNames().Contains(fieldEntry.Key)) {
          return new ModelInfoReqResponses.ValidateLayerFieldsResponseFieldNonexistent(fieldEntry.Key);
        }
      }

      var validated = ModelUtilsNS.ModelUtils.validateLayerFields(
        versionedModel.getCurrent(),
        layerId,
        fieldValues
      );

      return new ModelInfoReqResponses.ValidateLayerFieldsResponseNoError(validated.errors, validated.warnings);
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

      if (ModelUtilsNS.ModelUtils.isLayerValueOccupied(
        versionedModel.getCurrent(),
        layerId,
        valueId
      )) {
        return new ModelInfoReqResponses.ValueIsReadonlyResponseIsReadonly(ModelInfoReqResponses.ReadonlyReason.port_is_occupied);
      }

      if (!ModelUtilsNS.ModelUtils.isLayerFieldParameter(versionedModel.getCurrent(), layerId, valueId)) {
        return new ModelInfoReqResponses.ValueIsReadonlyResponseIsReadonly(ModelInfoReqResponses.ReadonlyReason.value_is_not_modifiable);
      }

      return new ModelInfoReqResponses.ValueIsReadonlyResponseNotReadonly();
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
