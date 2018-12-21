using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

// fields are assigned to from json
#pragma warning disable 0649
namespace ModelVersioningRequests {
  public static class Dispatcher {
    public static void dispatch(JObject jobj) {
      string type = jobj["type"].ToString();

      if (type == "undo") {
        Undo.dispatch(jobj);
      } else if (type == "redo") {
        Redo.dispatch(jobj);
      } else if (type == "saveFile") {
        SaveFile.dispatch(jobj);
      } else if (type == "openFile") {
        OpenFile.dispatch(jobj);
      } else if (type == "deleteFile") {
        DeleteFile.dispatch(jobj);
      }
    }
  }

  internal struct Undo {
    public static void dispatch(JObject jobj) {
      throw new System.Exception("unimplemented");
    }
  }

  internal struct Redo {
    public static void dispatch(JObject jobj) {
      throw new System.Exception("unimplemented");
    }
  }

  internal struct SaveFile {
    public static void dispatch(JObject jobj) {
      throw new System.Exception("unimplemented");
    }
  }

  internal struct OpenFile {
    public static void dispatch(JObject jobj) {
      throw new System.Exception("unimplemented");
    }

    public string fileName;
  }

  internal struct DeleteFile {
    public static void dispatch(JObject jobj) {
      throw new System.Exception("unimplemented");
    }

    public string fileName;
  }
}
#pragma warning restore 0649
