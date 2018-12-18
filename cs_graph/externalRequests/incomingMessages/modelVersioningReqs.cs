using Newtonsoft.Json;

// fields are assigned to from json
#pragma warning disable 0649
namespace ModelVersioningRequests {
  public static class Dispatcher {
    public static void dispatch(string str) {
      GenericReq genericReq = JsonConvert.DeserializeObject<GenericReq>(str);

      if (genericReq.type == "undo") {
        Undo.dispatch(str);
      } else if (genericReq.type == "redo") {
        Redo.dispatch(str);
      } else if (genericReq.type == "saveFile") {
        SaveFile.dispatch(str);
      } else if (genericReq.type == "openFile") {
        OpenFile.dispatch(str);
      } else if (genericReq.type == "deleteFile") {
        DeleteFile.dispatch(str);
      }
    }
  }
  internal class GenericReq {
    public string type;
  }

  internal class Undo {
    public static void dispatch(string str) {
      Undo undoReq = JsonConvert.DeserializeObject<Undo>(str);
      System.Console.WriteLine("unimplemented");
    }
  }

  internal class Redo {
    public static void dispatch(string str) {
      Redo redoReq = JsonConvert.DeserializeObject<Redo>(str);
      System.Console.WriteLine("unimplemented");
    }
  }

  internal class SaveFile {
    public static void dispatch(string str) {
      SaveFile saveFileReq = JsonConvert.DeserializeObject<SaveFile>(str);
      System.Console.WriteLine("unimplemented");
    }
  }

  internal class OpenFile {
    public static void dispatch(string str) {
      OpenFile openFileReq = JsonConvert.DeserializeObject<OpenFile>(str);
      System.Console.WriteLine("unimplemented");
    }

    public string fileName;
  }

  internal class DeleteFile {
    public static void dispatch(string str) {
      DeleteFile deleteFileReq = JsonConvert.DeserializeObject<DeleteFile>(str);
      System.Console.WriteLine("unimplemented");
    }

    public string fileName;
  }
}
#pragma warning restore 0649
// {
//   type: "undo";
// } | {
//   type: "redo";
// } | {
//   type: "saveFile";
//   fileName: string;
// } | {
//   type: "openFile";
//   fileName: string;
// } | {
//   type: "deleteFile";
//   fileName: string;
// };
