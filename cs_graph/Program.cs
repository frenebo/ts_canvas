using System.Collections.Generic;
using Newtonsoft.Json;

namespace cs_graph {
  class Program {
    static void Main(string[] args) {
      ModelClasses.ModelContainer model = new ModelClasses.ModelContainer {
        layerDict = new LayerContainers.LayerDict {
          layers = new Dictionary<string, Layers.Layer>()
        },
        graph = new NetworkContainersNS.Graph {
          vertices = new Dictionary<string, NetworkContainersNS.Vertex>(),
          edges = new Dictionary<string, NetworkContainersNS.Edge>()
        },
        edgesByVertex = new Dictionary<string, ModelClasses.VertexEdgesInfo>()
      };

      string[] ids = new string[] {"a", "b", "c", "d"};

      for (int i = 0; i < ids.Length; i++) {
        model.graph.vertices[ids[i]] = new NetworkContainersNS.Vertex {
          label = "Some Layer",
          xLocation = 10*i,
          yLocation = 10*i,
          ports = new Dictionary<string, NetworkContainersNS.NetworkPort>()
        };
        model.edgesByVertex[ids[i]] = new ModelClasses.VertexEdgesInfo {
          edgesIn = new List<string>(),
          edgesOut = new List<string>()
        };
      }

      Program.listenInput(model);
    }

    private static async System.Threading.Tasks.Task listenInput(ModelClasses.ModelContainer modelStruct) {
      while (true) {
        string line = await System.Console.In.ReadLineAsync();
        try {
          var jobj = Newtonsoft.Json.Linq.JObject.Parse(line);

          ServerRequests.Dispatcher.dispatch(jobj, modelStruct);
        } catch (System.Exception exp) {
          System.Console.Error.WriteLine("Line: " + line);
          System.Console.Error.WriteLine("Error: " + exp.ToString());
        }
      }
    }
  }
}
