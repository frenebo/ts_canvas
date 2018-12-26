using System.Collections.Generic;

namespace ModelClasses {
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
  public class ModelContainer {
    public LayerContainers.LayerDict layerDict;

    public NetworkContainersNS.Graph graph;

    public Dictionary<string, VertexEdgesInfo> edgesByVertex;

    public ModelContainer clone() {
      var clonedEdgesByVertex = new Dictionary<string, VertexEdgesInfo>();

      foreach (KeyValuePair<string, VertexEdgesInfo> entry in this.edgesByVertex) {
        clonedEdgesByVertex[entry.Key] = entry.Value.clone();
      }
      
      return new ModelContainer {
        layerDict = this.layerDict.clone(),
        graph = this.graph.clone(),
        edgesByVertex = clonedEdgesByVertex
      };
    }
  }
}
