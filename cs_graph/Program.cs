using System.Collections.Generic;
using Newtonsoft.Json;

namespace cs_graph {
  class Program {
    static void Main(string[] args) {
      VersionedModelClassNS.VersionedModelClass versionedModel = new VersionedModelClassNS.VersionedModelClass();

      string[] ids = new string[] {"a", "b", "c", "d"};

      for (int i = 0; i < ids.Length; i++) {
        ModelUtilsNS.ModelUtils.addLayer(
          versionedModel,
          ids[i],
          "Repeat",
          10*i,
          10*i
        );
      }
      
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
