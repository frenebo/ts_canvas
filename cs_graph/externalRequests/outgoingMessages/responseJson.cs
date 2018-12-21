using System.Collections.Generic;

namespace ResponseJson {
  public struct GraphPortData {
    public string side;
    public float location;
    public string portType;
  }

  public struct GeoData {
    public float x;
    public float y;
  }

  public struct VertexData {
    public string label;
    public GeoData geo;
    public Dictionary<string, GraphPortData> ports;
  }

  public struct EdgeData {
    public string consistency;
    public string sourceVertexId;
    public string sourcePortId;
    public string targetVertexId;
    public string targetPortId;
  }

  public struct GraphData {
    public Dictionary<string, VertexData> vertices;
    public Dictionary<string, EdgeData> edges;
  }

  public struct LayerPortData {
    public string valueName;
  }

  public struct LayerFieldData {
    public string value;
    public bool fieldIsReadonly;
  }

  public struct LayerData {
    public Dictionary<string, LayerPortData> ports;
    public Dictionary<string, LayerFieldData> fields;
  }
}
