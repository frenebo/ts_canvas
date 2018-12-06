import { Layer, LayerJsonInfo } from "./layers.js";
import { LayerData, ModelInfoResponseMap } from "../../../interfaces.js";

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
  ): ModelInfoResponseMap["getPortInfo"] {
    if (layers[layerId] === undefined) return {couldFindPort: false};
    if (layers[layerId].getPortIds().indexOf(portId) === -1) return {couldFindPort: false};
    const valueId = layers[layerId].getPortInfo(portId).valueKey;
    const portVal = layers[layerId].getValueWrapper(valueId).stringify();
    return {
      couldFindPort: true,
      portValue: portVal, // placeholder
    };
  }

  public static getLayerInfo(
    layers: LayerClassDict,
    layerId: string,
  ): ModelInfoResponseMap["getLayerInfo"] {
    const layer = layers[layerId];
    if (layer === undefined) return {layerExists: false};

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

    return {
      layerExists: true,
      data: data,
    };
  }

  public static setLayerFields(
    layers: LayerClassDict,
    layerId: string,
    fieldValues: {[key: string]: string},
  ): void {
    const layer = layers[layerId];
    if (layer === undefined) throw new Error(`No layer found with id ${layerId}`);

    for (const fieldId in fieldValues) {
      if (!layer.hasField(fieldId)) throw new Error(`Layer has no field named ${fieldId}`);

      if (layer.isReadonlyField(fieldId)) throw new Error(`Field ${fieldId} is readonly`);

      layer.getValueWrapper(fieldId).setFromString(fieldValues[fieldId]);
    }
    layer.update();
  }

  public static validateLayerFields(
    layers: LayerClassDict,
    layerId: string,
    fieldValues: {[key: string]: string},
  ): ModelInfoResponseMap["validateLayerFields"] {
    const errors: string[] = [];

    const origLayer = layers[layerId];
    if (origLayer === undefined) return {requestError: false};

    const cloneLayer = Layer.clone(origLayer);

    for (const fieldId in fieldValues) {
      if (!cloneLayer.hasField(fieldId)) {
        return {requestError: "field_nonexistent"};
      }
      if (cloneLayer.isReadonlyField(fieldId)) {
        errors.push(`Layer field ${fieldId} is readonly`);
        continue;
      }
      const valWrapper = cloneLayer.getValueWrapper(fieldId);
      const validate = valWrapper.validateString(fieldValues[fieldId]);
      if (validate !== null) {
        errors.push(`Field ${fieldId} has invalid value: ${validate}`);
        continue;
      }

      valWrapper.setFromString(fieldValues[fieldId]);
    }

    const validated = cloneLayer.validateUpdate();

    return {
      requestError: null,
      errors: validated.errors,
      warnings: validated.warnings,
    }
  }

  public static validateValue(
    layers: LayerClassDict,
    layerId: string,
    valueId: string,
    newValueString: string,
  ): ModelInfoResponseMap["validateValue"] {
    const layer = layers[layerId];
    if (layer === undefined) return {requestError: "layer_nonexistent"};

    if (!layer.hasField(valueId)) return {requestError: "field_nonexistent"};

    return {
      requestError: null,
      invalidError: layer.getValueWrapper(valueId).validateString(newValueString),
    }
  }

  public static compareValue(
    layers: LayerClassDict,
    layerId: string,
    valueId: string,
    compareString: string,
  ): ModelInfoResponseMap["compareValue"] {
    const layer = layers[layerId];
    if (layer === undefined) return {requestError: "layer_nonexistent"};

    if (!layer.hasField(valueId)) return {requestError: "field_nonexistent"};

    return {
      requestError: null,
      isEqual: layer.getValueWrapper(valueId).compareToString(compareString),
    }
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
