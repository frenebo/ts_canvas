using System.Collections.Generic;

namespace ModelUtils {
  public static class ModelUtils {
    public static ResponseJson.GraphData getResponseJsonData(ModelContainer.ModelContainer modelStruct) {
      return GraphUtils.GraphUtils.getResponseJsonData(modelStruct.graph);
    }

    public static void moveVertex(
      ModelContainer.ModelContainer modelStruct,
      string vertexId,
      float x,
      float y
    ) {
      GraphUtils.GraphUtils.moveVertex(modelStruct, vertexId, x, y);
    }

    public static void cloneVertex(
      ModelContainer.ModelContainer modelStruct,
      string sourceVertexId,
      string newVertexId,
      float x,
      float y
    ) {
      GraphUtils.GraphUtils.cloneVertex(modelStruct, sourceVertexId, newVertexId, x, y);
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
      ModelContainer.ModelContainer modelContainer,
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
      ModelContainer.ModelContainer modelContainer,
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
      ModelContainer.ModelContainer modelContainer,
      List<string> vertexIds
    ) {
      var edgesOut = new HashSet<string>();
      var edgesIn = new HashSet<string>();
      
      foreach (string vtxId in vertexIds) {
        modelContainer.edgesByVertex[vtxId].edgesIn.ForEach((string edgeId) => edgesIn.Add(edgeId));
        modelContainer.edgesByVertex[vtxId].edgesOut.ForEach((string edgeId) => edgesOut.Add(edgeId));
      }

      edgesOut.IntersectWith(edgesIn);

      return new List<string>(edgesOut);
    }
  }
}
