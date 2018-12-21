using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

// fields are assigned to from json
#pragma warning disable 0649
namespace ModelVersioningRequests {
  public static class Dispatcher {
    public static void dispatch(JObject jobj) {
      GenericReq genericReq = jobj.ToObject<GenericReq>();

      if (genericReq.type == "undo") {
        Undo.dispatch(jobj);
      } else if (genericReq.type == "redo") {
        Redo.dispatch(jobj);
      } else if (genericReq.type == "saveFile") {
        SaveFile.dispatch(jobj);
      } else if (genericReq.type == "openFile") {
        OpenFile.dispatch(jobj);
      } else if (genericReq.type == "deleteFile") {
        DeleteFile.dispatch(jobj);
      }
    }
  }

  internal struct GenericReq {
    public string type;
  }

  internal struct Undo {
    public static void dispatch(JObject jobj) {
      Undo undoReq = jobj.ToObject<Undo>();
    }
  }

  internal struct Redo {
    public static void dispatch(JObject jobj) {
      Redo redoReq = jobj.ToObject<Redo>();
    }
  }

  internal struct SaveFile {
    public static void dispatch(JObject jobj) {
      SaveFile saveFileReq = jobj.ToObject<SaveFile>();
    }
  }

  internal struct OpenFile {
    public static void dispatch(JObject jobj) {
      OpenFile openFileReq = jobj.ToObject<OpenFile>();
    }

    public string fileName;
  }

  internal struct DeleteFile {
    public static void dispatch(JObject jobj) {
      DeleteFile deleteFileReq = jobj.ToObject<DeleteFile>();
    }

    public string fileName;
  }
}
#pragma warning restore 0649
