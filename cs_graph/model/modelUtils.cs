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
      GraphUtilsNS.GraphUtils.moveVertex(modelStruct, vertexId, x, y);
    }

    public static void cloneVertex(
      ModelClassNS.ModelClass modelStruct,
      string sourceVertexId,
      string newVertexId,
      float x,
      float y
    ) {
      GraphUtilsNS.GraphUtils.cloneVertex(modelStruct, sourceVertexId, newVertexId, x, y);
    }

    public static void deleteVertex(
      ModelClassNS.ModelClass modelStruct,
      string vertexId
    ) {
      GraphUtilsNS.GraphUtils.deleteVertex(modelStruct, vertexId);
    }

    public static void deleteEdge(
      ModelClassNS.ModelClass modelStruct,
      string edgeId
    ) {
      GraphUtilsNS.GraphUtils.deleteEdge(modelStruct, edgeId);
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
        modelStruct,
        newEdgeId,
        sourceVertexId,
        sourcePortId,
        targetVertexId,
        targetPortId
      );
    }

    private static List<string> getUniqueIds(
      System.Func<string, bool> testFunc,
      int count
    ) {
      
      var random = new System.Random();
      HashSet<string> uniqueIds = new HashSet<string>();

      for (int i = 0; i < count; i++) {
        // const float random
        double dbl = random.NextDouble();
        int multiplier = 10;
        bool done = false;
        string id = "";
        while (!done) {
          id = System.Convert.ToInt32(dbl*multiplier).ToString();
          done = (!uniqueIds.Contains(id)) && (!testFunc(id));
          multiplier *= 10;
        }
        uniqueIds.Add(id);
      }

      return new List<string>(uniqueIds);      
    }

    public static List<string> getUniqueVertexIds(
      ModelClassNS.ModelClass modelContainer,
      int count
    ) {
      return ModelUtils.getUniqueIds(
        (string id) => {
          return modelContainer.graph.vertices.ContainsKey(id);
        },
        count
      );
    }

    public static List<string> getUniqueEdgeIds(
      ModelClassNS.ModelClass modelContainer,
      int count
    ) {
      return ModelUtils.getUniqueIds(
        (string id) => {
          return modelContainer.graph.edges.ContainsKey(id);
        },
        count
      );
    }

    public static List<string> getEdgesBetweenVertices(
      ModelClassNS.ModelClass modelContainer,
      List<string> vertexIds
    ) {
      var edgesOut = new HashSet<string>();
      var edgesIn = new HashSet<string>();
      
      foreach (string vtxId in vertexIds) {
        if (!modelContainer.edgesByVertex.ContainsKey(vtxId)) {
          throw new System.Exception("No such vertex id");
        }
        
        modelContainer.edgesByVertex[vtxId].edgesIn.ForEach((string edgeId) => edgesIn.Add(edgeId));
        modelContainer.edgesByVertex[vtxId].edgesOut.ForEach((string edgeId) => edgesOut.Add(edgeId));
      }

      edgesOut.IntersectWith(edgesIn);

      return new List<string>(edgesOut);
    }
  }
}
