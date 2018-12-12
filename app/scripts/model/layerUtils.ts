import {
  ILayerData,
  ModelInfoReqs,
} from "../interfaces.js";
import {
  ILayerJsonInfo,
  Layer,
} from "./layers/layers.js";

export interface ILayerClassDict {
  [key: string]: Layer;
}

export interface ILayerClassDictJson {
  [key: string]: ILayerJsonInfo;
}

export class LayerUtils {
  public static getPortInfo(args: {
    layers: ILayerClassDict;
    portId: string;
    layerId: string;
  }): ModelInfoReqs["getPortInfo"]["response"] {
    if (args.layers[args.layerId] === undefined) {
      return {couldFindPort: false};
    }

    if (args.layers[args.layerId].getPortIds().indexOf(args.portId) === -1) {
      return {couldFindPort: false};
    }

    const valueId = args.layers[args.layerId].getPortInfo(args.portId).valueKey;
    const portVal = args.layers[args.layerId].getValueWrapper(valueId).stringify();
    return {
      couldFindPort: true,
      portValue: portVal, // placeholder
    };
  }

  public static getLayerInfo(args: {
    layers: ILayerClassDict;
    layerId: string;
  }): ModelInfoReqs["getLayerInfo"]["response"] {
    const layer = args.layers[args.layerId];
    if (layer === undefined) {
      return {
        layerExists: false,
      };
    }

    const data: ILayerData = {
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
      };
    }

    return {
      data: data,
      layerExists: true,
    };
  }

  public static setLayerFields(args: {
    layers: ILayerClassDict;
    layerId: string;
    fieldValues: {[key: string]: string};
  }): void {
    const layer = args.layers[args.layerId];
    if (layer === undefined) {
      throw new Error(`No layer found with id ${args.layerId}`);
    }

    for (const fieldId of Object.keys(args.fieldValues)) {
      if (!layer.hasField(fieldId)) throw new Error(`Layer has no field named ${fieldId}`);

      if (layer.isReadonlyField(fieldId)) throw new Error(`Field ${fieldId} is readonly`);

      layer.getValueWrapper(fieldId).setFromString(args.fieldValues[fieldId]);
    }
    layer.update();
  }

  public static validateLayerFields(args: {
    layers: ILayerClassDict;
    layerId: string;
    fieldValues: {[key: string]: string};
  }): ModelInfoReqs["validateLayerFields"]["response"] {
    const errors: string[] = [];

    const origLayer = args.layers[args.layerId];
    if (origLayer === undefined) {
      return {requestError: "layer_nonexistent"};
    }

    const cloneLayer = Layer.clone(origLayer);

    for (const fieldId of Object.keys(args.fieldValues)) {
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
      errors: validated.errors,
      requestError: null,
      warnings: validated.warnings,
    };
  }

  public static validateValue(args: {
    layers: ILayerClassDict;
    layerId: string;
    valueId: string;
    newValueString: string;
  }): ModelInfoReqs["validateValue"]["response"] {
    const layer = args.layers[args.layerId];
    if (layer === undefined) {
      return {requestError: "layer_nonexistent"};
    }

    if (!layer.hasField(args.valueId)) {
      return {requestError: "field_nonexistent", fieldName: args.valueId};
    }

    return {
      fieldValidationError: layer.getValueWrapper(args.valueId).validateString(args.newValueString),
      requestError: null,
    };
  }

  public static compareValue(args: {
    layers: ILayerClassDict;
    layerId: string;
    valueId: string;
    compareString: string;
  }): ModelInfoReqs["compareValue"]["response"] {
    const layer = args.layers[args.layerId];
    if (layer === undefined) {
      return {requestError: "layer_nonexistent"};
    }

    if (!layer.hasField(args.valueId)) {
      return {requestError: "field_nonexistent"};
    }

    return {
      isEqual: layer.getValueWrapper(args.valueId).compareToString(args.compareString),
      requestError: null,
    };
  }

  public static cloneLayer(args: {
    layers: ILayerClassDict;
    layerId: string;
    newLayerId: string;
  }): void {
    const origLayer = args.layers[args.layerId];
    if (origLayer === undefined) {
      throw new Error(`No layer found with id ${args.layerId}`);
    }

    if (args.layers[args.newLayerId] !== undefined) {
      throw new Error(`A layer with the id ${args.newLayerId} already exists`);
    }

    args.layers[args.newLayerId] = Layer.fromJson(Layer.toJson(origLayer));
  }

  public static addLayer(args: {
    layers: ILayerClassDict;
    newLayerId: string;
    layer: Layer;
  }): void {
    if (args.layers[args.newLayerId] !== undefined) {
      throw new Error(`A layer with the id ${args.newLayerId} already exists`);
    }

    args.layers[args.newLayerId] = args.layer;
  }

  public static deleteLayer(args: {
    layers: ILayerClassDict;
    layerId: string;
  }): void {
    if (args.layers[args.layerId] === undefined) {
      throw new Error(`No layer found with id ${args.layerId}`);
    }

    delete args.layers[args.layerId];
  }

  public static toJson(layers: ILayerClassDict): ILayerClassDictJson {
    const layerDictJson: ILayerClassDictJson = {};
    for (const layerKey of Object.keys(layers)) {
      layerDictJson[layerKey] = Layer.toJson(layers[layerKey]);
    }

    return layerDictJson;
  }

  public static fromJson(layerDictjson: ILayerClassDictJson): ILayerClassDict {
    const layers: ILayerClassDict = {};
    for (const layerKey of Object.keys(layerDictjson)) {
      layers[layerKey] = Layer.fromJson(layerDictjson[layerKey]);
    }

    return layers;
  }
}
