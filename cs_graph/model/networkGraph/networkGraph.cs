using System.Collections.Generic;

namespace NetworkGraph {
  public enum SideType { Top, Bottom, Left, Right };
  public enum PortType { Input, Output };

  public struct NetworkGraph {
    public Dictionary<string, NetworkVertex> vertices;
    public Dictionary<string, NetworkEdge> edges;
  }

  public struct NetworkVertex {
    float xPos;
    float yPos;
    Dictionary<string, NetworkPort> ports;
  }

  public struct NetworkEdge {
    string sourceVertexId;
    string sourcePortId;
    string targetVertexId;
    string targetPortId;
  }

  public struct NetworkPort {
    SideType side;
    float position;
    PortType type;
  }
}
