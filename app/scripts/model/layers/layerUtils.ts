import {
  Layer,
  LayerJsonInfo,
} from "./layers.js";
import {
  LayerData,
  ModelInfoReqs,
} from "../../interfaces.js";

export interface LayerClassDict {
  [key: string]: Layer;
}

export interface LayerClassDictJson {
  [key: string]: LayerJsonInfo;
}

export class LayerUtils {
  public static getPortInfo(args: {
    layers: LayerClassDict;
    portId: string;
    layerId: string;
  }): ModelInfoReqs["getPortInfo"]["response"] {
    if (args.layers[args.layerId] === undefined) return {couldFindPort: false};
    if (args.layers[args.layerId].getPortIds().indexOf(args.portId) === -1) return {couldFindPort: false};
    const valueId = args.layers[args.layerId].getPortInfo(args.portId).valueKey;
    const portVal = args.layers[args.layerId].getValueWrapper(valueId).stringify();
    return {
      couldFindPort: true,
      portValue: portVal, // placeholder
    };
  }

  public static getLayerInfo(args: {
    layers: LayerClassDict;
    layerId: string;
  }): ModelInfoReqs["getLayerInfo"]["response"] {
    const layer = args.layers[args.layerId];
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

  public static setLayerFields(args: {
    layers: LayerClassDict;
    layerId: string;
    fieldValues: {[key: string]: string};
  }): void {
    const layer = args.layers[args.layerId];
    if (layer === undefined) throw new Error(`No layer found with id ${args.layerId}`);

    for (const fieldId in args.fieldValues) {
      if (!layer.hasField(fieldId)) throw new Error(`Layer has no field named ${fieldId}`);

      if (layer.isReadonlyField(fieldId)) throw new Error(`Field ${fieldId} is readonly`);

      layer.getValueWrapper(fieldId).setFromString(args.fieldValues[fieldId]);
    }
    layer.update();
  }

  public static validateLayerFields(args: {
    layers: LayerClassDict;
    layerId: string;
    fieldValues: {[key: string]: string};
  }): ModelInfoReqs["validateLayerFields"]["response"] {
    const errors: string[] = [];

    const origLayer = args.layers[args.layerId];
    if (origLayer === undefined) return {requestError: "layer_nonexistent"};

    const cloneLayer = Layer.clone(origLayer);

    for (const fieldId in args.fieldValues) {
      if (!cloneLayer.hasField(fieldId)) {
        return {requestError: "field_nonexistent", fieldName: fieldId};
      }
      if (cloneLayer.isReadonlyField(fieldId)) {
        errors.push(`Layer field ${fieldId} is readonly`);
        continue;
      }
      const valWrapper = cloneLayer.getValueWrapper(fieldId);
      const validate = valWrapper.validateString(args.fieldValues[fieldId]);
      if (validate !== null) {
        errors.push(`Field ${fieldId} has invalid value: ${validate}`);
        continue;
      }

      valWrapper.setFromString(args.fieldValues[fieldId]);
    }

    const validated = cloneLayer.validateUpdate();

    return {
      requestError: null,
      errors: validated.errors,
      warnings: validated.warnings,
    };
  }

  public static validateValue(args: {
    layers: LayerClassDict;
    layerId: string;
    valueId: string;
    newValueString: string;
  }): ModelInfoReqs["validateValue"]["response"] {
    const layer = args.layers[args.layerId];
    if (layer === undefined) return {requestError: "layer_nonexistent"};

    if (!layer.hasField(args.valueId)) return {requestError: "field_nonexistent", fieldName: args.valueId};

    return {
      requestError: null,
      invalidError: layer.getValueWrapper(args.valueId).validateString(args.newValueString),
    };
  }

  public static compareValue(args: {
    layers: LayerClassDict;
    layerId: string;
    valueId: string;
    compareString: string;
  }): ModelInfoReqs["compareValue"]["response"] {
    const layer = args.layers[args.layerId];
    if (layer === undefined) return {requestError: "layer_nonexistent"};

    if (!layer.hasField(args.valueId)) return {requestError: "field_nonexistent"};

    return {
      requestError: null,
      isEqual: layer.getValueWrapper(args.valueId).compareToString(args.compareString),
    };
  }

  public static cloneLayer(args: {
    layers: LayerClassDict;
    layerId: string;
    newLayerId: string;
  }): void {
    const origLayer = args.layers[args.layerId];
    if (origLayer === undefined) throw new Error(`No layer found with id ${args.layerId}`);
    if (args.layers[args.newLayerId] !== undefined) {
      throw new Error(`A layer with the id ${args.newLayerId} already exists`);
    }

    args.layers[args.newLayerId] = Layer.fromJson(Layer.toJson(origLayer));
  }

  public static addLayer(args: {
    layers: LayerClassDict;
    newLayerId: string;
    layer: Layer;
  }): void {
    if (args.layers[args.newLayerId] !== undefined) {
      throw new Error(`A layer with the id ${args.newLayerId} already exists`);
    }

    args.layers[args.newLayerId] = args.layer;
  }

  public static deleteLayer(args: {
    layers: LayerClassDict;
    layerId: string;
  }): void {
    if (args.layers[args.layerId] === undefined) throw new Error(`No layer found with id ${args.layerId}`);

    delete args.layers[args.layerId];
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
