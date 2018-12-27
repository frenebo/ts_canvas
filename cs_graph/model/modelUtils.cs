using System.Collections.Generic;

namespace ModelUtilsNS {
  public static class ModelUtils {
    public static ResponseJson.GraphData getResponseJsonData(ModelClassNS.ModelClass modelStruct) {
      return GraphUtilsNS.GraphUtils.getResponseJsonData(modelStruct.graph);
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

    public static bool isValueReadonly(
      ModelClassNS.ModelClass modelContainer,
      string layerId,
      string valueId
    ) {
      return LayerUtilsNS.LayerUtils.isValueReadonly(modelContainer.layerDict, layerId, valueId);
    }
  }
}
