using System.Collections.Generic;

namespace ModelContainer {
  public class VertexEdgesInfo {
    public List<string> edgesIn;
    public List<string> edgesOut;
  }
  public struct ModelContainer {
    public LayerDict.LayerDict layerDict;

    public NetworkGraph.Graph graph;

    public Dictionary<string, VertexEdgesInfo> edgesByVertex;
  }
}
