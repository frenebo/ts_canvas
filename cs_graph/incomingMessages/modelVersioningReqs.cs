
namespace ModelVersioningRequests {
  class Undo {
    public static Undo fromJson(string str) {
      return JsonConvert.DeserializeObject<Undo>(str);
    }
  }

  class Redo {
    public static Redo fromJson(string str) {
      return JsonConvert.DeserializeObject<Redo>(str);
    }
  }

  class SaveFile {
    public static SaveFile fromJson(string str) {
      return JsonConvert.DeserializeObject<SaveFile>(str);
    }
  }

  class OpenFile {
    public static OpenFile fromJson(string str) {
      return JsonConvert.DeserializeObject<OpenFile>(str);
    }

    public string fileName;
  }

  class DeleteFile {
    public static DeleteFile fromJson(string str) {
      return JsonConvert.DeserializeObject<DeleteFile>(str);
    }

    public string fileName;
  }
}
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
