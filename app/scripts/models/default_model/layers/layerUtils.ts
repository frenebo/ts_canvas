import { Layer, LayerJsonInfo } from "./layers.js";
import { ValueWrapper } from "./valueWrappers/valueWrapper.js";
import { LayerData } from "../../../interfaces.js";

export type LayerClassDict = {
  [key: string]: Layer;
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
    const portVal = layers[layerId].getValueWrapper(valueId).stringify();
    return {
      portValue: portVal, // placeholder
    };
  }

  public static getLayerData(
    layers: LayerClassDict,
    layerId: string,
  ): LayerData {
    const layer = layers[layerId];
    if (layer === undefined) throw new Error(`Could not find layer with id ${layerId}`);

    const data: LayerData = {
      ports: {},
      fields: {},
    };
    for (const portId of layer.getPortIds()) {
      data.ports[portId] = {
        valueName: layer.getPortInfo(portId).valueKey,
      };
    }
    for (const valueId of layer.getFieldIds()) {
      data.fields[valueId] = {
        value: layer.getValueWrapper(valueId).stringify(),
        readonly: layer.isReadonlyField(valueId),
      };
    }

    return data;
  }

  public static setLayerFields(
    layers: LayerClassDict,
    layerId: string,
    fieldValues: {[key: string]: string},
  ): void {
    const layer = layers[layerId];
    if (layer === undefined) throw new Error(`No layer found with id ${layerId}`);

    for (const fieldId in fieldValues) {
      if (!layer.hasField(fieldId)) throw new Error(`Layer has no field names ${fieldId}`);

      if (layer.isReadonlyField(fieldId)) throw new Error(`Field ${fieldId} is readonly`);

      layer.getValueWrapper(fieldId).setFromString(fieldValues[fieldId]);
    }
    layer.update();
  }

  public static validateValue(
    layers: LayerClassDict,
    layerId: string,
    valueId: string,
    newValueString: string,
  ) {
    const layer = layers[layerId];
    if (layer === undefined) throw new Error(`No layer found with id ${layerId}`);

    if (!layer.hasField(valueId)) throw new Error(`Layer with type ${layer.getType()} has no value called ${valueId}`);

    return layer.getValueWrapper(valueId).validateString(newValueString);
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
    layer: Layer,
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
}
