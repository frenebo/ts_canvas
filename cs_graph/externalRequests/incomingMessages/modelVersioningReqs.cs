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

  internal struct GenericReq {
    public string type;
  }

  internal struct Undo {
    public static void dispatch(string str) {
      Undo undoReq = JsonConvert.DeserializeObject<Undo>(str);
    }
  }

  internal struct Redo {
    public static void dispatch(string str) {
      Redo redoReq = JsonConvert.DeserializeObject<Redo>(str);
    }
  }

  internal struct SaveFile {
    public static void dispatch(string str) {
      SaveFile saveFileReq = JsonConvert.DeserializeObject<SaveFile>(str);
    }
  }

  internal struct OpenFile {
    public static void dispatch(string str) {
      OpenFile openFileReq = JsonConvert.DeserializeObject<OpenFile>(str);
    }

    public string fileName;
  }

  internal struct DeleteFile {
    public static void dispatch(string str) {
      DeleteFile deleteFileReq = JsonConvert.DeserializeObject<DeleteFile>(str);
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
