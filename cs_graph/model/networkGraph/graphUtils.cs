using System.Collections.Generic;

namespace GraphUtils {
  public static class GraphUtils {
    public static ResponseJson.GraphData getResponseJsonData(NetworkGraph.Graph graph) {
      ResponseJson.GraphData responseJsonData = new ResponseJson.GraphData {
        vertices = new Dictionary<string, ResponseJson.VertexData>(),
        edges = new Dictionary<string, ResponseJson.EdgeData>()
      };

      foreach (KeyValuePair<string, NetworkGraph.Vertex> vtxEntry in graph.vertices) {
        responseJsonData.vertices[vtxEntry.Key] = GraphUtils.getVertexJsonData(vtxEntry.Value);
      }

      foreach(KeyValuePair<string, NetworkGraph.Edge> edgeEntry in graph.edges) {
        responseJsonData.edges[edgeEntry.Key] = GraphUtils.getEdgeJsonData(edgeEntry.Value);
      }

      return responseJsonData;
    }

    private static ResponseJson.VertexData getVertexJsonData(NetworkGraph.Vertex vtx) {
      ResponseJson.VertexData jsonVtxData = new ResponseJson.VertexData {
        label = vtx.label,
        geo = new ResponseJson.GeoData {
          x = vtx.xLocation,
          y = vtx.yLocation,
        },
        ports = new Dictionary<string, ResponseJson.GraphPortData>()
      };

      foreach (KeyValuePair<string, NetworkGraph.NetworkPort> edgeEntry in vtx.ports) {
        jsonVtxData.ports[edgeEntry.Key] = new ResponseJson.GraphPortData {
          side = GraphUtils.getPortSideString(edgeEntry.Value.side),
          location = edgeEntry.Value.position,
          portType = GraphUtils.getPortTypeString(edgeEntry.Value.type)
        };
      }

      return jsonVtxData;
    }

    private static string getPortTypeString(NetworkGraph.PortType portType) {
      switch (portType) {
      case NetworkGraph.PortType.Input: return "input";
      case NetworkGraph.PortType.Output: return "output";
      default: throw new System.ArgumentOutOfRangeException();
      }
    }

    private static string getPortSideString(NetworkGraph.SideType sideType) {
      switch (sideType) {
      case NetworkGraph.SideType.Top: return "top";
      case NetworkGraph.SideType.Bottom: return "bottom";
      case NetworkGraph.SideType.Left: return "left";
      case NetworkGraph.SideType.Right: return "right";
      default: throw new System.ArgumentOutOfRangeException();
      }
    }

    private static string getEdgeConsistencyString(NetworkGraph.ConsistencyType consistencyType) {
      switch (consistencyType) {
      case NetworkGraph.ConsistencyType.Consistent: return "consistent";
      case NetworkGraph.ConsistencyType.Inconsistent: return "inconsistent";
      default: throw new System.ArgumentOutOfRangeException();
      }
    }

    public static ResponseJson.EdgeData getEdgeJsonData(NetworkGraph.Edge edge) {
      return new ResponseJson.EdgeData {
        consistency = GraphUtils.getEdgeConsistencyString(edge.consistency),
        sourceVertexId = edge.sourceVertexId,
        sourcePortId = edge.sourcePortId,
        targetVertexId = edge.targetVertexId,
        targetPortId = edge.targetPortId
      };
    }

    public static void moveVertex(
      ModelContainer.ModelContainer modelStruct,
      string vertexId,
      float x,
      float y
    ) {
      NetworkGraph.Vertex vtx = modelStruct.graph.vertices[vertexId];
      vtx.xLocation = x;
      vtx.yLocation = y;
      // GraphUtils.GraphUtils.moveVertex(modelStruct, vertexId, x, y);
    }

    public static void cloneVertex(
      ModelContainer.ModelContainer modelStruct,
      string sourceVertexId,
      string newVertexId,
      float x,
      float y
    ) {
      NetworkGraph.Vertex newVtx = modelStruct.graph.vertices[sourceVertexId].clone();
      modelStruct.graph.vertices[newVertexId] = newVtx;
      newVtx.xLocation = x;
      newVtx.yLocation = y;

      modelStruct.edgesByVertex[newVertexId] = new ModelContainer.VertexEdgesInfo {
        edgesIn = new List<string>(),
        edgesOut = new List<string>()
      };
    }
  }
}
