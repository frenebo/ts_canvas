using ModelChangeReqs;

namespace cs_graph
{
  class Program
  {
    static void Main(string[] args)
    {
      System.IO.TextReader tIn = System.Console.In;
      System.IO.TextWriter tOut = System.Console.Out;

      System.Console.WriteLine("Hello World!");
      ModelChangeReqs.ChangeReqDispatcher.dispatchReqString("{\"type\": \"moveVertex\", \"vertexId\": \"asdf\", \"x\": 1, \"y\": 2}");
    }
  }
}
