using System.Collections.Generic;

namespace ModelClassNS {
  public class VertexEdgesInfo {
    public List<string> edgesIn;
    public List<string> edgesOut;

    public VertexEdgesInfo clone() {
      return new VertexEdgesInfo {
        edgesIn = new List<string>(this.edgesIn),
        edgesOut = new List<string>(this.edgesOut)
      };
    }
  }
  public class ModelClass {
    public LayerContainers.LayerDict layerDict = new LayerContainers.LayerDict {
      layers = new Dictionary<string, Layers.Layer>()
    };

    public NetworkContainersNS.Graph graph = new NetworkContainersNS.Graph {
      vertices = new Dictionary<string, NetworkContainersNS.Vertex>(),
      edges = new Dictionary<string, NetworkContainersNS.Edge>()
    };

    public Dictionary<string, VertexEdgesInfo> edgesByVertex = new Dictionary<string, ModelClassNS.VertexEdgesInfo>();

    public ModelClass clone() {
      var clonedEdgesByVertex = new Dictionary<string, VertexEdgesInfo>();

      foreach (KeyValuePair<string, VertexEdgesInfo> entry in this.edgesByVertex) {
        clonedEdgesByVertex[entry.Key] = entry.Value.clone();
      }
      
      return new ModelClass {
        layerDict = this.layerDict.clone(),
        graph = this.graph.clone(),
        edgesByVertex = clonedEdgesByVertex
      };
    }
  }
}
