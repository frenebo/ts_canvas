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
      Program.listenInput();
      // ServerRequests.Dispatcher.dispatch("{\"type\": \"request_model_changes\", \"reqs\": [{\"a\": 3}, {}]}");
    }

    private static async System.Threading.Tasks.Task listenInput() {
      string currentLine = "";
      while (true) {
        char[] charBuf = new char[10];
        await System.Console.In.ReadAsync(charBuf, 0, charBuf.Length);

        string newText = new string(charBuf);

        int returnIdx;
        while ((returnIdx = newText.IndexOf("\n")) != -1) {
          currentLine += newText.Substring(0, returnIdx);
          System.Console.WriteLine("line: " + currentLine);
          currentLine = "";
          newText = newText.Substring(returnIdx + 1);
        }
        currentLine += newText;
      }
    }
  }
}
