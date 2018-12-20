
namespace ModelUtils {
  public static class ModelUtils {
    public static ResponseJson.GraphData getResponseJsonData(ModelStruct.ModelStruct modelStruct) {
      return GraphUtils.GraphUtils.getResponseJsonData(modelStruct.graph);
    }
  }
}
