using System.Collections.Generic;
using Newtonsoft.Json;

namespace cs_graph {
  class Program {
    static void Main(string[] args) {
      ModelStruct.ModelStruct model = new ModelStruct.ModelStruct {
        layerDict = new LayerDict.LayerDict {
          layers = new Dictionary<string, Layers.Layer>()
        },
        graph = new NetworkGraph.Graph {
          vertices = new Dictionary<string, NetworkGraph.Vertex>(),
          edges = new Dictionary<string, NetworkGraph.Edge>()
        }
      };

      string[] ids = new string[] {"a", "b", "c", "d"};

      for (int i = 0; i < ids.Length; i++) {
        model.graph.vertices[ids[i]] = new NetworkGraph.Vertex {
          label = "Some Layer",
          xLocation = 10*i,
          yLocation = 10*1,
          ports = new Dictionary<string, NetworkGraph.NetworkPort>()
        };
      }

      Program.listenInput(model);
    }

    private static async System.Threading.Tasks.Task listenInput(ModelStruct.ModelStruct modelStruct) {
      while (true) {
        string line = await System.Console.In.ReadLineAsync();
        try {
          var parseWatch = System.Diagnostics.Stopwatch.StartNew();
          
          var jobj = Newtonsoft.Json.Linq.JObject.Parse(line);
          
          parseWatch.Stop();
          var parseElapsedMs = parseWatch.ElapsedMilliseconds;
          System.Console.Error.WriteLine("Request parse time: " + parseElapsedMs.ToString());

          var dispatchWatch = System.Diagnostics.Stopwatch.StartNew();
          
          ServerRequests.Dispatcher.dispatch(jobj, modelStruct);

          dispatchWatch.Stop();
          var dispatchElapsedMs = dispatchWatch.ElapsedMilliseconds;
          System.Console.Error.WriteLine("Request dispatch time: " + dispatchElapsedMs);

        } catch (System.Exception exp) {
          System.Console.Error.WriteLine("Error: " + exp.ToString());
        }
      }
    }
  }
}
