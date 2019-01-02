using System.Collections.Generic;
using Newtonsoft.Json;

namespace cs_graph {
  class Program {
    static void Main(string[] args) {
      VersionedModelClassNS.VersionedModelClass versionedModel = new VersionedModelClassNS.VersionedModelClass();

      string[] ids = new string[] {"a", "b", "c", "d", "e"};

      for (int i = 0; i < ids.Length; i++) {
        ModelUtilsNS.ModelUtils.addLayer(
          versionedModel,
          ids[i],
          i%2 == 0 ? "Repeat" : "Add",
          10*i,
          10*i
        );
      }
      
      while (true) {
        string line = System.Console.In.ReadLine();
        try {
          var jobj = Newtonsoft.Json.Linq.JObject.Parse(line);

          System.Diagnostics.Stopwatch stopWatch = new System.Diagnostics.Stopwatch();
          stopWatch.Start();

          ServerRequests.Dispatcher.dispatch(jobj, versionedModel);
          
          stopWatch.Stop();
          // Get the elapsed time as a TimeSpan value.
          System.TimeSpan ts = stopWatch.Elapsed;
          string elapsedTime = string.Format("{0:00}:{1:00}:{2:00}.{3:00}",
          ts.Hours, ts.Minutes, ts.Seconds,
          ts.Milliseconds / 10);
          System.Console.Error.WriteLine("Request run time " + elapsedTime);
        } catch (System.Exception exp) {
          System.Console.Error.WriteLine("Line: " + line);
          System.Console.Error.WriteLine("Error: " + exp.ToString());
        }
      }
    }
  }
}
