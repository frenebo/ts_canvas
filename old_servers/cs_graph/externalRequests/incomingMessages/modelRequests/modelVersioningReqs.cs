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
        return SaveFile.dispatch(jobj, versionedModel);
      } else if (type == "openFile") {
        return OpenFile.dispatch(jobj, versionedModel);
      } else if (type == "deleteFile") {
        return DeleteFile.dispatch(jobj, versionedModel);
      } else {
        throw new InvalidInfoReqType(type);
      }
    }
  }

  internal class Undo {
    public static ModelVersioningReqResponses.UndoReqResponse dispatch(JObject jobj, VersionedModelClassNS.VersionedModelClass versionedModel) {
      versionedModel.tryUndo();
      return new ModelVersioningReqResponses.UndoReqResponse();
    }
  }

  internal class Redo {
    public static ModelVersioningReqResponses.RedoReqResponse dispatch(JObject jobj, VersionedModelClassNS.VersionedModelClass versionedModel) {
      versionedModel.tryRedo();
      return new ModelVersioningReqResponses.RedoReqResponse();
    }
  }

  internal class SaveFile {
    public static ModelVersioningReqResponses.ModelVersioningReqResponse dispatch(JObject jobj, VersionedModelClassNS.VersionedModelClass versionedModel) {
      string fileName = jobj["fileName"].ToString();
      versionedModel.saveToFile(fileName);

      return new ModelVersioningReqResponses.SaveFileReqResponse();
    }
  }

  internal class OpenFile {
    public static ModelVersioningReqResponses.ModelVersioningReqResponse dispatch(JObject jobj, VersionedModelClassNS.VersionedModelClass versionedModel) {
      string fileName = jobj["fileName"].ToString();
      if (versionedModel.fileExistsWithName(fileName)) {
        versionedModel.unsafeOpen(fileName);
      }

      return new ModelVersioningReqResponses.OpenFileReqResponse();
    }

    public string fileName;
  }

  internal class DeleteFile {
    public static ModelVersioningReqResponses.ModelVersioningReqResponse dispatch(JObject jobj, VersionedModelClassNS.VersionedModelClass versionedModel) {
      string fileName = jobj["fileName"].ToString();
      if (versionedModel.fileExistsWithName(fileName)) {
        versionedModel.unsafeDelete(fileName);
      }

      return new ModelVersioningReqResponses.DeleteFileReqResponse();
    }

    public string fileName;
  }
}
#pragma warning restore 0649
