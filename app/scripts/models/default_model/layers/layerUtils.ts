import { Layer, GenericLayer, LayerJsonInfo } from "./layers.js";
import { LayerDataDict } from "../../../interfaces.js";
import { ValueWrapper } from "./valueWrappers/valueWrapper.js";

export type LayerClassDict = {
  [key: string]: GenericLayer;
}

export type LayerClassDictJson = {
  [key: string]: LayerJsonInfo;
}

export class LayerUtils {
  public static getPortInfo(
    layers: LayerClassDict,
    portId: string,
    layerId: string,
  ) {
    const valueId = layers[layerId].getPortInfo(portId).valueKey;
    const portVal = layers[layerId].getValue(valueId).stringify();
    return {
      portValue: portVal, // placeholder
    };
  }

  public static cloneLayer(
    layers: LayerClassDict,
    layerId: string,
    newLayerId: string,
  ): void {
    const origLayer = layers[layerId];
    if (origLayer === undefined) throw new Error(`No layer found with id ${layerId}`);
    if (layers[newLayerId] !== undefined) throw new Error(`A layer with the id ${newLayerId} already exists`);

    layers[newLayerId] = Layer.fromJson(Layer.toJson(origLayer));
  }

  public static addLayer(
    layers: LayerClassDict,
    newLayerId: string,
    layer: GenericLayer,
  ): void {
    if (layers[newLayerId] !== undefined) throw new Error(`A layer with the id ${newLayerId} already exists`);

    layers[newLayerId] = layer;
  }

  public static deleteLayer(
    layers: LayerClassDict,
    layerId: string,
  ): void {
    if (layers[layerId] === undefined) throw new Error(`No layer found with id ${layerId}`);

    delete layers[layerId];
  }

  public static toJson(layers: LayerClassDict): LayerClassDictJson {
    const layerDictJson: LayerClassDictJson = {};
    for (const layerKey in layers) {
      layerDictJson[layerKey] = Layer.toJson(layers[layerKey]);
    }

    return layerDictJson;
  }

  public static fromJson(layerDictjson: LayerClassDictJson): LayerClassDict {
    const layers: LayerClassDict = {};
    for (const layerKey in layerDictjson) {
      layers[layerKey] = Layer.fromJson(layerDictjson[layerKey]);
    }
    return layers;
  }

  public static getLayerDataDict(layerClassDict: LayerClassDict): LayerDataDict {
    const dataDict: LayerDataDict = {};
    for (const layerKey in layerClassDict) {
      const layer = layerClassDict[layerKey];

      dataDict[layerKey] = {
        ports: {},
      };
      for (const portId of layer.portIds()) {
        dataDict[layerKey].ports[portId] = {
          valueName: layer.getPortInfo(portId).valueKey,
        };
      }
    }

    return dataDict;
  }
}
