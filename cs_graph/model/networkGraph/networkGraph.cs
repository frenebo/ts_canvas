using System.Collections.Generic;

namespace NetworkGraph {
  public enum SideType { Top, Bottom, Left, Right };
  public enum PortType { Input, Output };
  public enum ConsistencyType { Consistent, Inconsistent };

  public struct Graph {
    public Dictionary<string, Vertex> vertices;
    public Dictionary<string, Edge> edges;
  }

  public struct Vertex {
    public string label;
    public float xLocation;
    public float yLocation;
    public Dictionary<string, NetworkPort> ports;
  }

  public struct Edge {
    public ConsistencyType consistency;
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
