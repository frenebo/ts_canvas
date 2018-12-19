using System.Collections.Generic;

namespace JsonGraphInterfaces {
  struct IGraphPortData {
    string side;
    float location;
    string portType;
  }

  struct IVertexData {
    string label;
    float xPos;
    float yPos;
    Dictionary<string, IGraphPortData> ports;
  }

  struct IEdgeData {
    string consistency;
    string sourceVertexId;
    string sourcePortId;
    string targetVertexId;
    string targetPortId;
  }

  struct IGraphData {
    Dictionary<string, IVertexData> vertices;
    Dictionary<string, IEdgeData> edges;
  }

  struct ILayerPortData {
    string valueName;
  }

  struct ILayerFieldData {
    string value;
    bool fieldIsReadonly;
  }

  struct ILayerData {
    Dictionary<string, ILayerPortData> ports;
    Dictionary<string, ILayerFieldData> fields;
  }
}
