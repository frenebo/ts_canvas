using System.Collections.Generic;

namespace NetworkGraph {
  public enum SideType { Top, Bottom, Left, Right };
  public enum PortType { Input, Output };
  public enum ConsistencyType { Consistent, Inconsistent };

  public class Graph {
    public Dictionary<string, Vertex> vertices;
    public Dictionary<string, Edge> edges;
  }

  public class Vertex {
    public string label;
    public float xLocation;
    public float yLocation;
    public Dictionary<string, NetworkPort> ports;

    public Vertex clone() {
      var newPorts = new Dictionary<string, NetworkPort>();

      foreach (KeyValuePair<string, NetworkPort> entry in this.ports) {
        newPorts[entry.Key] = entry.Value.clone();
      }
      
      return new Vertex {
        label = this.label,
        xLocation = this.xLocation,
        yLocation = this.yLocation,
        ports = newPorts
      };
    }
  }

  public class Edge {
    public ConsistencyType consistency;
    public string sourceVertexId;
    public string sourcePortId;
    public string targetVertexId;
    public string targetPortId;
  }

  public class NetworkPort {
    public SideType side;
    public float position;
    public PortType type;

    public NetworkPort clone() {
      return new NetworkPort {
        side = this.side,
        position = this.position,
        type = this.type
      };
    }
  }
}
