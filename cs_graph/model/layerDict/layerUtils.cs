using System.Collections.Generic;
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

    public static string validateFieldValue(
      LayerContainers.LayerDict layerDict,
      string layerId,
      string valueId,
      string valueToValidate
    ) {
      return layerDict.layers[layerId].validateFieldString(valueId, valueToValidate);
    }

    public static bool compareFieldValue(
      LayerContainers.LayerDict layerDict,
      string layerId,
      string valueId,
      string valueToValidate
    ) {
      return layerDict.layers[layerId].compareFieldValue(valueId, valueToValidate);
    }
    
    public static Layers.LayersValidated validateLayerFields(
      LayerContainers.LayerDict layerDict,
      string layerId,
      Dictionary<string, string> fieldValues
    ) {
      return layerDict.layers[layerId].validateSetFields(fieldValues);
    }

    public static void setLayerFields(
      LayerContainers.LayerDict layerDict,
      string layerId,
      Dictionary<string, string> fieldValues
    ) {
      layerDict.layers[layerId].setFields(fieldValues);
    }
  }
}
