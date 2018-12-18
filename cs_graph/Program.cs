using ModelChangeReqs;
using Newtonsoft.Json;

namespace cs_graph {
  class Program {
    static void Main(string[] args) {
      Program.listenInput();
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
