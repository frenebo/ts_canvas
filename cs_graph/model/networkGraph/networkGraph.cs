using System.Collections.Generic;

namespace NetworkGraph {
  public enum SideType { Top, Bottom, Left, Right };
  public enum PortType { Input, Output };

  public struct NetworkGraph {
    public Dictionary<string, NetworkVertex> vertices;
    public Dictionary<string, NetworkEdge> edges;
  }

  public struct NetworkVertex {
    public float xPos;
    public float yPos;
    public Dictionary<string, NetworkPort> ports;
  }

  public struct NetworkEdge {
    public string sourceVertexId;
    public string sourcePortId;
    public string targetVertexId;
    public string targetPortId;
  }

  public struct NetworkPort {
    public SideType side;
    public float position;
    public PortType type;
  }
}
