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

      Program.listenInput(model);
    }

    private static async System.Threading.Tasks.Task listenInput(ModelStruct.ModelStruct modelStruct) {
      while (true) {
        string line = await System.Console.In.ReadLineAsync();
        ServerRequests.Dispatcher.dispatch(line, modelStruct);
      }
    }
  }
}
