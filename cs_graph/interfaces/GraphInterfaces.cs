using System.Collections.Generic;

namespace GraphInterfaces {
  enum SideType {Top, Bottom, Left, Right};
  enum PortType {Input, Output};
  enum ConsistencyType {Consistent, Inconsistent};

  interface IGraphPortData {
    SideType side { get; }
    float location { get; }
    PortType portType { get; }
  }

  interface IVertexData {
    string label { get; }
    float xPos { get; }
    float yPos { get; }
    Dictionary<string, IGraphPortData> ports { get; }
  }

  interface IEdgeData {
    ConsistencyType consistency { get; }
    string sourceVertexId { get; }
    string sourcePortId { get; }
    string targetVertexId { get; }
    string targetPortId { get; }
  }

  interface IGraphData {
    Dictionary<string, IVertexData> vertices { get; }
    Dictionary<string, IEdgeData> edges { get; }
  }

  interface ILayerPortData {
    string valueName { get; }
  }

  interface ILayerFieldData {
    string value { get; }
    bool fieldIsReadonly { get; }
  }

  interface ILayerData {
    Dictionary<string, ILayerPortData> ports { get; }
    Dictionary<string, ILayerFieldData> fields { get; }
  }
}
