using System.Collections.Generic;
using System.Linq;

namespace GraphUtilsNS {
  public static class GraphUtils {
    public static ResponseJson.GraphData getResponseJsonData(NetworkContainersNS.Graph graph) {
      ResponseJson.GraphData responseJsonData = new ResponseJson.GraphData {
        vertices = new Dictionary<string, ResponseJson.VertexData>(),
        edges = new Dictionary<string, ResponseJson.EdgeData>()
      };

      foreach (KeyValuePair<string, NetworkContainersNS.Vertex> vtxEntry in graph.vertices) {
        responseJsonData.vertices[vtxEntry.Key] = GraphUtils.getVertexJsonData(vtxEntry.Value);
      }

      foreach(KeyValuePair<string, NetworkContainersNS.Edge> edgeEntry in graph.edges) {
        responseJsonData.edges[edgeEntry.Key] = GraphUtils.getEdgeJsonData(edgeEntry.Value);
      }

      return responseJsonData;
    }

    private static ResponseJson.VertexData getVertexJsonData(NetworkContainersNS.Vertex vtx) {
      ResponseJson.VertexData jsonVtxData = new ResponseJson.VertexData {
        label = vtx.label,
        geo = new ResponseJson.GeoData {
          x = vtx.xLocation,
          y = vtx.yLocation,
        },
        ports = new Dictionary<string, ResponseJson.GraphPortData>()
      };

      foreach (KeyValuePair<string, NetworkContainersNS.NetworkPort> edgeEntry in vtx.ports) {
        jsonVtxData.ports[edgeEntry.Key] = new ResponseJson.GraphPortData {
          side = GraphUtils.getPortSideString(edgeEntry.Value.side),
          position = edgeEntry.Value.position,
          portType = GraphUtils.getPortTypeString(edgeEntry.Value.type)
        };
      }

      return jsonVtxData;
    }

    private static string getPortTypeString(NetworkContainersNS.PortType portType) {
      switch (portType) {
      case NetworkContainersNS.PortType.Input: return "input";
      case NetworkContainersNS.PortType.Output: return "output";
      default: throw new System.ArgumentOutOfRangeException();
      }
    }

    private static string getPortSideString(NetworkContainersNS.SideType sideType) {
      switch (sideType) {
      case NetworkContainersNS.SideType.Top: return "top";
      case NetworkContainersNS.SideType.Bottom: return "bottom";
      case NetworkContainersNS.SideType.Left: return "left";
      case NetworkContainersNS.SideType.Right: return "right";
      default: throw new System.ArgumentOutOfRangeException();
      }
    }

    private static string getEdgeConsistencyString(NetworkContainersNS.ConsistencyType consistencyType) {
      switch (consistencyType) {
      case NetworkContainersNS.ConsistencyType.Consistent: return "consistent";
      case NetworkContainersNS.ConsistencyType.Inconsistent: return "inconsistent";
      default: throw new System.ArgumentOutOfRangeException();
      }
    }

    public static ResponseJson.EdgeData getEdgeJsonData(NetworkContainersNS.Edge edge) {
      return new ResponseJson.EdgeData {
        consistency = GraphUtils.getEdgeConsistencyString(edge.consistency),
        sourceVertexId = edge.sourceVertexId,
        sourcePortId = edge.sourcePortId,
        targetVertexId = edge.targetVertexId,
        targetPortId = edge.targetPortId
      };
    }

    public static void moveVertex(
      NetworkContainersNS.Graph graph,
      string vertexId,
      float x,
      float y
    ) {
      NetworkContainersNS.Vertex vtx = graph.vertices[vertexId];
      vtx.xLocation = x;
      vtx.yLocation = y;
    }

    public static string validateEdge(
      NetworkContainersNS.Graph graph,
      Dictionary<string, ModelClassNS.VertexEdgesInfo> edgesByVertex,
      string newEdgeId,
      string sourceVertexId,
      string sourcePortId,
      string targetVertexId,
      string targetPortId
    ) {
      // check vertices and ports
      if (!graph.vertices.ContainsKey(sourceVertexId)) {
        return "Vertex with given source id does not exist";
      }
      if (!graph.vertices.ContainsKey(targetVertexId)) {
        return "Vertex with given target id does not exist";
      }
      if (!graph.vertices[sourceVertexId].ports.ContainsKey(sourcePortId)) {
        return "Source vertex does not have port with given id";
      }
      if (!graph.vertices[targetVertexId].ports.ContainsKey(targetPortId)) {
        return "Target vertex does not have port with given id";
      }
      if (graph.vertices[sourceVertexId].ports[sourcePortId].type != NetworkContainersNS.PortType.Output) {
        return "Source port is not an output port";
      }
      if (graph.vertices[targetVertexId].ports[targetPortId].type != NetworkContainersNS.PortType.Input) {
        return "Target port is not an input port";
      }

      // check if an identical edge already exists
      var edgesBetweenTwoVtxs = edgesByVertex[sourceVertexId].edgesOut.Where(id => edgesByVertex[targetVertexId].edgesIn.Contains(id));
      foreach (string edgeId in edgesBetweenTwoVtxs) {
        if (
          graph.edges[edgeId].sourcePortId == sourcePortId &&
          graph.edges[edgeId].targetPortId == targetPortId
        ) {
          return "Identical connection already exists";
        }
      }

      // search for loop
      HashSet<string> vertexIdsToInvestigate = new HashSet<string>() {sourceVertexId};
      HashSet<string> ancestorsOfSourceVtx = new HashSet<string>();

      while (vertexIdsToInvestigate.Count != 0) {
        string investigateVertexId = vertexIdsToInvestigate.ElementAt(0);
        vertexIdsToInvestigate.Remove(investigateVertexId);
        ancestorsOfSourceVtx.Add(investigateVertexId);

        foreach (string edgeInId in edgesByVertex[investigateVertexId].edgesIn) {
          string edgeSourceVertex = graph.edges[edgeInId].sourceVertexId;

          if (
            !vertexIdsToInvestigate.Contains(edgeSourceVertex) &&
            !ancestorsOfSourceVtx.Contains(edgeSourceVertex)
          ) {
            vertexIdsToInvestigate.Add(edgeSourceVertex);
          }
        }
      }

      if (ancestorsOfSourceVtx.Contains(targetVertexId)) {
        return "Loop detected";
      }

      return null;
    }

    public static void deleteVertex(
      NetworkContainersNS.Graph graph,
      Dictionary<string, ModelClassNS.VertexEdgesInfo> edgesByVertex,
      string vertexId
    ) {
      if (!graph.vertices.ContainsKey(vertexId)) {
        throw new System.Exception("Vertex with given id does not exist");
      }

      // Use ToList because C# won't allow the edges by vertex collection to be modified while it is being iterated over
      foreach (string edgeId in edgesByVertex[vertexId].edgesIn.Union(edgesByVertex[vertexId].edgesOut).ToList()) {
        GraphUtils.deleteEdge(graph, edgesByVertex, edgeId);
      }

      graph.vertices.Remove(vertexId);
      edgesByVertex.Remove(vertexId);
    }

    public static void deleteEdge(
      NetworkContainersNS.Graph graph,
      Dictionary<string, ModelClassNS.VertexEdgesInfo> edgesByVertex,
      string edgeId
    ) {
      if (!graph.edges.ContainsKey(edgeId)) {
        throw new System.Exception("Edge with given id does not exist");
      }

      NetworkContainersNS.Edge edge = graph.edges[edgeId];
      graph.edges.Remove(edgeId);

      edgesByVertex[edge.sourceVertexId].edgesOut.Remove(edgeId);
      edgesByVertex[edge.targetVertexId].edgesIn.Remove(edgeId);
    }

    public static void createEdge(
      NetworkContainersNS.Graph graph,
      Dictionary<string, ModelClassNS.VertexEdgesInfo> edgesByVertex,
      string newEdgeId,
      string sourceVertexId,
      string sourcePortId,
      string targetVertexId,
      string targetPortId
    ) {
      // nullable
      string validated = GraphUtils.validateEdge(
        graph,
        edgesByVertex,
        newEdgeId,
        sourceVertexId,
        sourcePortId,
        targetVertexId,
        targetPortId
      );

      if (validated != null) {
        throw new System.Exception(validated);
      }

      graph.edges[newEdgeId] = new NetworkContainersNS.Edge {
        consistency =  NetworkContainersNS.ConsistencyType.Consistent,
        sourceVertexId = sourceVertexId,
        sourcePortId = sourcePortId,
        targetVertexId = targetVertexId,
        targetPortId = targetPortId,
      };

      edgesByVertex[sourceVertexId].edgesOut.Add(newEdgeId);
      edgesByVertex[targetVertexId].edgesIn.Add(newEdgeId);
    }

    public static void cloneVertex(
      NetworkContainersNS.Graph graph,
      Dictionary<string, ModelClassNS.VertexEdgesInfo> edgesByVertex,
      string sourceVertexId,
      string newVertexId,
      float x,
      float y
    ) {
      if (graph.vertices.ContainsKey(newVertexId)) {
        throw new System.Exception("Vertex with new key already exists");
      }
      if (!graph.vertices.ContainsKey(sourceVertexId)) {
        throw new System.Exception("Vertex with source id does not exist");
      }
      
      NetworkContainersNS.Vertex newVtx = graph.vertices[sourceVertexId].clone();
      graph.vertices[newVertexId] = newVtx;
      newVtx.xLocation = x;
      newVtx.yLocation = y;

      edgesByVertex[newVertexId] = new ModelClassNS.VertexEdgesInfo {
        edgesIn = new List<string>(),
        edgesOut = new List<string>()
      };
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
      NetworkContainersNS.Graph graph,
      int count
    ) {
      return GraphUtils.getUniqueIds(
        (string id) => {
          return graph.vertices.ContainsKey(id);
        },
        count
      );
    }

    public static List<string> getUniqueEdgeIds(
      NetworkContainersNS.Graph graph,
      int count
    ) {
      return GraphUtils.getUniqueIds(
        (string id) => {
          return graph.edges.ContainsKey(id);
        },
        count
      );
    }

    public static List<string> getEdgesBetweenVertices(
      NetworkContainersNS.Graph graph,
      Dictionary<string, ModelClassNS.VertexEdgesInfo> edgesByVertex,
      List<string> vertexIds
    ) {
      var edgesOut = new HashSet<string>();
      var edgesIn = new HashSet<string>();
      
      foreach (string vtxId in vertexIds) {
        if (!edgesByVertex.ContainsKey(vtxId)) {
          throw new System.Exception("No such vertex id");
        }
        
        edgesByVertex[vtxId].edgesIn.ForEach((string edgeId) => edgesIn.Add(edgeId));
        edgesByVertex[vtxId].edgesOut.ForEach((string edgeId) => edgesOut.Add(edgeId));
      }

      edgesOut.IntersectWith(edgesIn);

      return new List<string>(edgesOut);
    }
  }
}
