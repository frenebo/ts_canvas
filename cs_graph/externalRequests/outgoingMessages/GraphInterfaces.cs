using System.Collections.Generic;

namespace JsonGraphInterfaces {
  public struct IGraphPortData {
    public string side;
    public float location;
    public string portType;
  }

  public struct IVertexData {
    public string label;
    public float xPos;
    public float yPos;
    public Dictionary<string, IGraphPortData> ports;
  }

  public struct IEdgeData {
    public string consistency;
    public string sourceVertexId;
    public string sourcePortId;
    public string targetVertexId;
    public string targetPortId;
  }

  public struct IGraphData {
    public Dictionary<string, IVertexData> vertices;
    public Dictionary<string, IEdgeData> edges;
  }

  public struct ILayerPortData {
    public string valueName;
  }

  public struct ILayerFieldData {
    public string value;
    public bool fieldIsReadonly;
  }

  public struct ILayerData {
    public Dictionary<string, ILayerPortData> ports;
    public Dictionary<string, ILayerFieldData> fields;
  }
}
