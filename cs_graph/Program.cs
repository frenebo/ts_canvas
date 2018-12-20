using System.Collections.Generic;
using Newtonsoft.Json;

namespace cs_graph {
  class Program {
    static void Main(string[] args) {
      ModelClass.ModelClass model = new ModelClass.ModelClass {
        layerDict = new LayerDict.LayerDict {
          layers = new Dictionary<string, Layers.Layer>()
        },
        networkGraph = new NetworkGraph.NetworkGraph {
          vertices = new Dictionary<string, NetworkGraph.NetworkVertex>(),
          edges = new Dictionary<string, NetworkGraph.NetworkEdge>()
        }
      };

      Program.listenInput(model);
    }

    private static async System.Threading.Tasks.Task listenInput(ModelClass.ModelClass modelClass) {
      while (true) {
        string line = await System.Console.In.ReadLineAsync();
        ServerRequests.Dispatcher.dispatch(line, modelClass);
      }
    }
  }
}
