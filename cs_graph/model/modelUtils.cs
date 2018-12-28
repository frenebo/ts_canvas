using System.Collections.Generic;
using System.Linq;

namespace ModelUtilsNS {
  public static class ModelUtils {
    public static ResponseJson.GraphData getResponseJsonData(ModelClassNS.ModelClass modelStruct) {
      return GraphUtilsNS.GraphUtils.getResponseJsonData(modelStruct.graph);
    }

    public static ResponseJson.LayerData getLayerJsonData(
      ModelClassNS.ModelClass modelStruct,
      string layerId
    ) {
      Layers.Layer layer = modelStruct.layerDict.layers[layerId];
      var ports = new Dictionary<string, ResponseJson.LayerPortData>();
      var fields = new Dictionary<string, ResponseJson.LayerFieldData>();

      foreach (string portName in layer.getPortNames()) {
        ports[portName] = new ResponseJson.LayerPortData {
          valueName = layer.getValueNameOfPort(portName),
        };
      }
      
      List<string> occupiedValueNames = modelStruct.edgesByVertex[layerId].edgesIn.Select((string edgeId) => {
        return modelStruct.layerDict.layers[layerId].getValueNameOfPort(modelStruct.graph.edges[edgeId].targetPortId);
      }).ToList();

      foreach (string fieldName in layer.getValueNames()) {
        bool fieldOccupiedByEdge = occupiedValueNames.Contains(fieldName);
        fields[fieldName] = new ResponseJson.LayerFieldData {
          value = layer.getValueString(fieldName),
          fieldIsReadonly = fieldOccupiedByEdge || layer.getValueIsReadonly(fieldName)
        };
      }

      return new ResponseJson.LayerData {
        ports = ports,
        fields = fields,
      };
    }

    public static void addLayer(
      VersionedModelClassNS.VersionedModelClass versionedModel,
      string layerId,
      string layerType,
      float x,
      float y
    ) {
      ModelClassNS.ModelClass modelClass = versionedModel.getCurrent();

      Layers.Layer layer = Layers.Layer.getNewLayerByType(layerType);
      
      NetworkContainersNS.Vertex newVertex = new NetworkContainersNS.Vertex {
        label = layerType + " Layer",
        xLocation = x,
        yLocation = y,
        ports = new Dictionary<string, NetworkContainersNS.NetworkPort>()
      };

      List<string> inputPortNames = new List<string>();
      List<string> outputPortNames = new List<string>();

      foreach (string portName in layer.getPortNames()) {
        if (layer.getValueIsReadonly(layer.getValueNameOfPort(portName))) {
          outputPortNames.Add(portName);
        } else {
          inputPortNames.Add(portName);
        }
      }

      for (int i = 0; i < inputPortNames.Count; i++) {
        // System.Console.Error.WriteLine(((float)(i + 1)) / ((float)(inputPortNames.Count + 1)));
        newVertex.ports[inputPortNames[i]] = new NetworkContainersNS.NetworkPort {
          side = NetworkContainersNS.SideType.Top,
          position = ((float)(i + 1)) / ((float)(inputPortNames.Count + 1)),
          type = NetworkContainersNS.PortType.Input,
        };
      }

      for (int i = 0; i < outputPortNames.Count; i++) {
        newVertex.ports[outputPortNames[i]] = new NetworkContainersNS.NetworkPort {
          side = NetworkContainersNS.SideType.Bottom,
          position = ((float)(i + 1)) / ((float)(outputPortNames.Count + 1)),
          type = NetworkContainersNS.PortType.Output,
        };
      }

      modelClass.graph.vertices[layerId] = newVertex;
      modelClass.layerDict.layers[layerId] = layer;
      modelClass.edgesByVertex[layerId] = new ModelClassNS.VertexEdgesInfo();
    }

    public static void propagateModel(ModelClassNS.ModelClass modelStruct) {
      List<string> topoSortedVertices = ModelUtils.topoSortVertices(modelStruct);

      foreach (string vertexId in topoSortedVertices) {
        foreach (string edgeOutId in modelStruct.edgesByVertex[vertexId].edgesOut) {
          ModelUtils.propagateEdge(modelStruct, edgeOutId);
        }
      }
    }

    private static void propagateEdge(ModelClassNS.ModelClass modelStruct, string edgeId) {
      NetworkContainersNS.Edge edge = modelStruct.graph.edges[edgeId];
      Layers.Layer sourceLayer = modelStruct.layerDict.layers[edge.sourceVertexId];
      Layers.Layer targetLayer = modelStruct.layerDict.layers[edge.targetVertexId];
      string sourceFieldName = sourceLayer.getValueNameOfPort(edge.sourcePortId);
      string targetFieldName = targetLayer.getValueNameOfPort(edge.targetPortId);

      bool edgeIsConsistent = targetLayer.compareFieldValue(targetFieldName, sourceLayer.getValueString(sourceFieldName));

      if (edgeIsConsistent) {
        edge.consistency = NetworkContainersNS.ConsistencyType.Consistent;
        return;
      }
      
      string validateFieldValue = targetLayer.validateFieldString(targetFieldName, sourceLayer.getValueString(sourceFieldName));
      if (validateFieldValue != null) {
        edge.consistency = NetworkContainersNS.ConsistencyType.Inconsistent;
        return;
      }

      Layers.LayersValidated validatedUpdate = targetLayer.validateSetFields(new Dictionary<string, string>() {
        {targetFieldName, sourceLayer.getValueString(sourceFieldName)},
      });
      if (validatedUpdate.errors.Count != 0) {
        edge.consistency = NetworkContainersNS.ConsistencyType.Inconsistent;
        return;
      }

      targetLayer.setFields(new Dictionary<string, string>() {
        {targetFieldName, sourceLayer.getValueString(sourceFieldName)},
      });
      edge.consistency = NetworkContainersNS.ConsistencyType.Consistent;
    }

    private static List<string> topoSortVertices(ModelClassNS.ModelClass modelStruct) {
      List<string> topToBottom = new List<string>();
      HashSet<string> remainingVertexIds = new HashSet<string>(modelStruct.graph.vertices.Keys);

      while (remainingVertexIds.Count != 0) {
        List<string> roots = remainingVertexIds.Where((string vtxId) => {
          foreach (string edgeId in modelStruct.edgesByVertex[vtxId].edgesIn) {
            NetworkContainersNS.Edge edge = modelStruct.graph.edges[edgeId];
            if (remainingVertexIds.Contains(edge.sourceVertexId)) {
              return false;
            }
          }
          
          return true;
        }).ToList();

        foreach (string rootId in roots) {
          topToBottom.Add(rootId);
          remainingVertexIds.Remove(rootId);
        }
      }

      return topToBottom;
    }

    public static void moveVertex(
      ModelClassNS.ModelClass modelStruct,
      string vertexId,
      float x,
      float y
    ) {
      GraphUtilsNS.GraphUtils.moveVertex(modelStruct.graph, vertexId, x, y);
    }

    public static string validateEdge(
      ModelClassNS.ModelClass modelStruct,
      string newEdgeId,
      string sourceVertexId,
      string sourcePortId,
      string targetVertexId,
      string targetPortId
    ) {
      return GraphUtilsNS.GraphUtils.validateEdge(
        modelStruct.graph,
        modelStruct.edgesByVertex,
        newEdgeId,
        sourceVertexId,
        sourcePortId,
        targetVertexId,
        targetPortId
      );
    }

    public static void cloneVertex(
      ModelClassNS.ModelClass modelStruct,
      string sourceVertexId,
      string newVertexId,
      float x,
      float y
    ) {
      GraphUtilsNS.GraphUtils.cloneVertex(
        modelStruct.graph,
        modelStruct.edgesByVertex,
        sourceVertexId,
        newVertexId,
        x,
        y
      );

      LayerUtilsNS.LayerUtils.cloneLayer(
        modelStruct.layerDict,
        sourceVertexId,
        newVertexId
      );
    }

    public static void deleteVertex(
      ModelClassNS.ModelClass modelStruct,
      string vertexId
    ) {
      GraphUtilsNS.GraphUtils.deleteVertex(
        modelStruct.graph,
        modelStruct.edgesByVertex,
        vertexId
      );

      LayerUtilsNS.LayerUtils.deleteLayer(
        modelStruct.layerDict,
        vertexId
      );
    }

    public static void deleteEdge(
      ModelClassNS.ModelClass modelStruct,
      string edgeId
    ) {
      GraphUtilsNS.GraphUtils.deleteEdge(
        modelStruct.graph,
        modelStruct.edgesByVertex,
        edgeId
      );
    }

    public static void createEdge(
      ModelClassNS.ModelClass modelStruct,
      string newEdgeId,
      string sourceVertexId,
      string sourcePortId,
      string targetVertexId,
      string targetPortId
    ) {
      GraphUtilsNS.GraphUtils.createEdge(
        modelStruct.graph,
        modelStruct.edgesByVertex,
        newEdgeId,
        sourceVertexId,
        sourcePortId,
        targetVertexId,
        targetPortId
      );
    }

    public static List<string> getUniqueVertexIds(
      ModelClassNS.ModelClass modelContainer,
      int count
    ) {
      return GraphUtilsNS.GraphUtils.getUniqueVertexIds(modelContainer.graph, count);
    }

    public static List<string> getUniqueEdgeIds(
      ModelClassNS.ModelClass modelContainer,
      int count
    ) {
      return GraphUtilsNS.GraphUtils.getUniqueEdgeIds(modelContainer.graph, count);
    }

    public static List<string> getEdgesBetweenVertices(
      ModelClassNS.ModelClass modelContainer,
      List<string> vertexIds
    ) {
      return GraphUtilsNS.GraphUtils.getEdgesBetweenVertices(
        modelContainer.graph,
        modelContainer.edgesByVertex,
        vertexIds
      );
    }

    public static bool isLayerValueOccupied(
      ModelClassNS.ModelClass modelContainer,
      string layerId,
      string valueId
    ) {
      List<string> edgesIn = modelContainer.edgesByVertex[layerId].edgesIn;

      foreach (string edgeId in edgesIn) {
        string edgePortId = modelContainer.graph.edges[edgeId].targetPortId;
        string edgeValueId = modelContainer.layerDict.layers[layerId].getValueNameOfPort(valueId);

        if (valueId == edgeValueId) return true;
      }

      return false;
    }

    public static bool isLayerFieldParameter(
      ModelClassNS.ModelClass modelContainer,
      string layerId,
      string valueId
    ) {
      return !LayerUtilsNS.LayerUtils.isValueReadonly(modelContainer.layerDict, layerId, valueId);
    }

    public static string validateFieldValue(
      ModelClassNS.ModelClass modelContainer,
      string layerId,
      string valueId,
      string valueToValidate
    ) {
      return LayerUtilsNS.LayerUtils.validateFieldValue(
        modelContainer.layerDict,
        layerId,
        valueId,
        valueToValidate
      );
    }

    public static bool compareFieldValue(
      ModelClassNS.ModelClass modelContainer,
      string layerId,
      string valueId,
      string valueToValidate
    ) {
      return LayerUtilsNS.LayerUtils.compareFieldValue(
        modelContainer.layerDict,
        layerId,
        valueId,
        valueToValidate
      );
    }

    public static Layers.LayersValidated validateLayerFields(
      ModelClassNS.ModelClass modelContainer,
      string layerId,
      Dictionary<string, string> fieldValues
    ) {
      return LayerUtilsNS.LayerUtils.validateLayerFields(
        modelContainer.layerDict,
        layerId,
        fieldValues
      );
    }

    public static void setLayerFields(
      ModelClassNS.ModelClass modelContainer,
      string layerId,
      Dictionary<string, string> fieldValues
    ) {
      LayerUtilsNS.LayerUtils.setLayerFields(
        modelContainer.layerDict,
        layerId,
        fieldValues
      );
    }
  }
}
