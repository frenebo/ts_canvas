using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

// fields are assigned to from json
#pragma warning disable 0649
namespace ModelVersioningRequests {
  public class InvalidInfoReqType : System.Exception {
    public InvalidInfoReqType(string message) : base(message) {}
  }
  public static class Dispatcher {
    public static ModelVersioningReqResponses.ModelVersioningReqResponse dispatch(
      JObject jobj,
      VersionedModelClassNS.VersionedModelClass versionedModel
    ) {
      string type = jobj["type"].ToString();

      if (type == "undo") {
        return Undo.dispatch(jobj, versionedModel);
      } else if (type == "redo") {
        return Redo.dispatch(jobj, versionedModel);
      } else if (type == "saveFile") {
        return SaveFile.dispatch(jobj);
      } else if (type == "openFile") {
        return OpenFile.dispatch(jobj);
      } else if (type == "deleteFile") {
        return DeleteFile.dispatch(jobj);
      } else {
        throw new InvalidInfoReqType(type);
      }
    }
  }

  internal struct Undo {
    public static ModelVersioningReqResponses.UndoReqResponse dispatch(JObject jobj, VersionedModelClassNS.VersionedModelClass versionedModel) {
      versionedModel.tryUndo();
      return new ModelVersioningReqResponses.UndoReqResponse();
    }
  }

  internal struct Redo {
    public static ModelVersioningReqResponses.RedoReqResponse dispatch(JObject jobj, VersionedModelClassNS.VersionedModelClass versionedModel) {
      versionedModel.tryRedo();
      return new ModelVersioningReqResponses.RedoReqResponse();
    }
  }

  internal struct SaveFile {
    public static ModelVersioningReqResponses.ModelVersioningReqResponse dispatch(JObject jobj) {
      throw new System.Exception("unimplemented");
    }
  }

  internal struct OpenFile {
    public static ModelVersioningReqResponses.ModelVersioningReqResponse dispatch(JObject jobj) {
      throw new System.Exception("unimplemented");
    }

    public string fileName;
  }

  internal struct DeleteFile {
    public static ModelVersioningReqResponses.ModelVersioningReqResponse dispatch(JObject jobj) {
      throw new System.Exception("unimplemented");
    }

    public string fileName;
  }
}
#pragma warning restore 0649
