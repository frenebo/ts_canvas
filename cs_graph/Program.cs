using System.Collections.Generic;
using Newtonsoft.Json;

namespace cs_graph {
  class Program {
    static void Main(string[] args) {
      VersionedModelClassNS.VersionedModelClass versionedModel = new VersionedModelClassNS.VersionedModelClass();
      
      // ModelClassNS.ModelClass model = new ModelClassNS.ModelClass();

      string[] ids = new string[] {"a", "b", "c", "d"};

      for (int i = 0; i < ids.Length; i++) {
        versionedModel.getCurrent().graph.vertices[ids[i]] = new NetworkContainersNS.Vertex {
          label = "Some Layer",
          xLocation = 10*i,
          yLocation = 10*i,
          ports = new Dictionary<string, NetworkContainersNS.NetworkPort>()
        };
        versionedModel.getCurrent().edgesByVertex[ids[i]] = new ModelClassNS.VertexEdgesInfo {
          edgesIn = new List<string>(),
          edgesOut = new List<string>()
        };
      }

      // Program.listenInput(model);
    // }

    // private static async System.Threading.Tasks.Task listenInput(ModelClasses.ModelContainer modelStruct) {
      while (true) {
        string line = System.Console.In.ReadLine();
        try {
          var jobj = Newtonsoft.Json.Linq.JObject.Parse(line);

          ServerRequests.Dispatcher.dispatch(jobj, versionedModel);
        } catch (System.Exception exp) {
          System.Console.Error.WriteLine("Line: " + line);
          System.Console.Error.WriteLine("Error: " + exp.ToString());
        }
      }
    }
  }
}
