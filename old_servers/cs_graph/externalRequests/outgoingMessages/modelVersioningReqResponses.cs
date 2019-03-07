
namespace ModelVersioningReqResponses {
  public abstract class ModelVersioningReqResponse {}

  public class UndoReqResponse : ModelVersioningReqResponse {}

  public class RedoReqResponse : ModelVersioningReqResponse {}

  public class SaveFileReqResponse : ModelVersioningReqResponse {}
  public class OpenFileReqResponse : ModelVersioningReqResponse {}
  public class DeleteFileReqResponse : ModelVersioningReqResponse {}

  // @TODO add classes for other ones
}
