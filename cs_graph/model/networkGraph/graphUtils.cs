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
          location = edgeEntry.Value.position,
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
      ModelClassNS.ModelClass modelStruct,
      string vertexId,
      float x,
      float y
    ) {
      NetworkContainersNS.Vertex vtx = modelStruct.graph.vertices[vertexId];
      vtx.xLocation = x;
      vtx.yLocation = y;
      // GraphUtils.GraphUtils.moveVertex(modelStruct, vertexId, x, y);
    }

    public static string validateEdge(
      ModelClassNS.ModelClass modelStruct,
      string newEdgeId,
      string sourceVertexId,
      string sourcePortId,
      string targetVertexId,
      string targetPortId
    ) {
      // check vertices and ports
      if (!modelStruct.graph.vertices.ContainsKey(sourceVertexId)) {
        return "Vertex with given source id does not exist";
      }
      if (!modelStruct.graph.vertices.ContainsKey(targetVertexId)) {
        return "Vertex with given target id does not exist";
      }
      if (!modelStruct.graph.vertices[sourceVertexId].ports.ContainsKey(sourcePortId)) {
        return "Source vertex does not have port with given id";
      }
      if (!modelStruct.graph.vertices[targetVertexId].ports.ContainsKey(targetPortId)) {
        return "Target vertex does not have port with given id";
      }
      if (modelStruct.graph.vertices[sourceVertexId].ports[sourcePortId].type != NetworkContainersNS.PortType.Output) {
        return "Source port is not an output port";
      }
      if (modelStruct.graph.vertices[targetVertexId].ports[targetVertexId].type != NetworkContainersNS.PortType.Input) {
        return "Target port is not an input port";
      }

      // check if an identical edge already exists
      var edgesBetweenTwoVtxs = modelStruct.edgesByVertex[sourceVertexId].edgesOut.Where(id => modelStruct.edgesByVertex[targetVertexId].edgesIn.Contains(id));
      foreach (string edgeId in edgesBetweenTwoVtxs) {
        if (
          modelStruct.graph.edges[edgeId].sourcePortId == sourcePortId &&
          modelStruct.graph.edges[edgeId].targetPortId == targetPortId
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

        foreach (string edgeInId in modelStruct.edgesByVertex[investigateVertexId].edgesIn) {
          string edgeSourceVertex = modelStruct.graph.edges[edgeInId].sourceVertexId;

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
      ModelClassNS.ModelClass modelStruct,
      string vertexId
    ) {
      if (!modelStruct.graph.vertices.ContainsKey(vertexId)) {
        throw new System.Exception("Vertex with given id does not exist");
      }
      
      foreach (string edgeId in modelStruct.edgesByVertex[vertexId].edgesIn.Union(modelStruct.edgesByVertex[vertexId].edgesOut)) {
        GraphUtils.deleteEdge(modelStruct, edgeId);
      }

      modelStruct.graph.vertices.Remove(vertexId);
      modelStruct.edgesByVertex.Remove(vertexId);
    }

    public static void deleteEdge(
      ModelClassNS.ModelClass modelStruct,
      string edgeId
    ) {
      if (!modelStruct.graph.edges.ContainsKey(edgeId)) {
        throw new System.Exception("Edge with given id does not exist");
      }

      NetworkContainersNS.Edge edge = modelStruct.graph.edges[edgeId];
      modelStruct.graph.edges.Remove(edgeId);

      modelStruct.edgesByVertex[edge.sourceVertexId].edgesOut.Remove(edgeId);
      modelStruct.edgesByVertex[edge.targetVertexId].edgesIn.Remove(edgeId);
    }

    public static void createEdge(
      ModelClassNS.ModelClass modelStruct,
      string newEdgeId,
      string sourceVertexId,
      string sourcePortId,
      string targetVertexId,
      string targetPortId
    ) {
      // nullable
      string validated = GraphUtils.validateEdge(
        modelStruct,
        newEdgeId,
        sourceVertexId,
        sourcePortId,
        targetVertexId,
        targetPortId
      );
      
      if (validated != null) {
        throw new System.Exception(validated);
      }

      modelStruct.graph.edges[newEdgeId] = new NetworkContainersNS.Edge {
        consistency =  NetworkContainersNS.ConsistencyType.Consistent,
        sourceVertexId = sourceVertexId,
        sourcePortId = sourcePortId,
        targetVertexId = targetVertexId,
        targetPortId = targetPortId,
      };

      modelStruct.edgesByVertex[sourceVertexId].edgesOut.Add(newEdgeId);
      modelStruct.edgesByVertex[targetVertexId].edgesIn.Add(newEdgeId);
    }

    public static void cloneVertex(
      ModelClassNS.ModelClass modelStruct,
      string sourceVertexId,
      string newVertexId,
      float x,
      float y
    ) {
      if (modelStruct.graph.vertices.ContainsKey(newVertexId)) {
        throw new System.Exception("Vertex with new key already exists");
      }
      if (!modelStruct.graph.vertices.ContainsKey(sourceVertexId)) {
        throw new System.Exception("Vertex with source id does not exist");
      }
      NetworkContainersNS.Vertex newVtx = modelStruct.graph.vertices[sourceVertexId].clone();
      modelStruct.graph.vertices[newVertexId] = newVtx;
      newVtx.xLocation = x;
      newVtx.yLocation = y;

      modelStruct.edgesByVertex[newVertexId] = new ModelClassNS.VertexEdgesInfo {
        edgesIn = new List<string>(),
        edgesOut = new List<string>()
      };
    }
  }
}
