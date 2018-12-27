using LayerContainers;

namespace LayerUtilsNS {
  public static class LayerUtils {
    public static void deleteLayer(
      LayerContainers.LayerDict layerDict,
      string layerId
    ) {
      layerDict.layers.Remove(layerId);
    }

    public static void cloneLayer(
      LayerContainers.LayerDict layerDict,
      string sourceLayerId,
      string newLayerId
    ) {
      if (layerDict.layers.ContainsKey(newLayerId)) {
        throw new System.Exception("Layer with new id already exists");
      }
      if (!layerDict.layers.ContainsKey(sourceLayerId)) {
        throw new System.Exception("Layer with source id does not exist");
      }

      layerDict.layers[newLayerId] = layerDict.layers[sourceLayerId].clone();
    }

    public static bool isValueReadonly(
      LayerContainers.LayerDict layerDict,
      string layerId,
      string valueId
    ) {
      return layerDict.layers[layerId].getValueIsReadonly(valueId);
    }
  }
}
