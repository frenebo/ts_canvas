import { ValueWrapper } from "../valueWrappers/valueWrapper.js";
import { AddLayer } from "./addLayer.js";
import { RepeatLayer } from "./repeatLayer.js";

export interface ILayerPortInfo {
  valueKey: string;
  type: "input" | "output";
}

const layerDict = {
  "AddLayer": () => new AddLayer(),
  "Repeat": () => new RepeatLayer(),
};

export type LayerType = keyof typeof layerDict;

export interface ILayerJsonInfo {
  layerType: string;
  valDict: {[key: string]: string};
}

export abstract class Layer {
  public static isLayerType(type: string): type is LayerType {
    return Object.keys(layerDict).indexOf(type) !== -1;
  }

  public static getLayer<T extends LayerType>(type: T): ReturnType<(typeof layerDict)[T]> {
    const layerConstructor = layerDict[type];
    return layerConstructor() as ReturnType<(typeof layerDict)[T]>;
  }

  public static toJson(layer: Layer): ILayerJsonInfo {
    const info: ILayerJsonInfo = {
      layerType: layer.getType(),
      valDict: {},
    };
    for (const valueKey of Object.keys(layer.fields)) {
      info.valDict[valueKey] = layer.fields[valueKey].wrapper.stringify();
    }
    return info;
  }

  public static fromJson(info: ILayerJsonInfo): Layer {
    if (!Layer.isLayerType(info.layerType)) {
      throw new Error(`Unknown layer type ${info.layerType}`);
    }

    const layer = Layer.getLayer(info.layerType);

    for (const valueKey of Object.keys(info.valDict)) {
      if (!layer.hasField(valueKey)) {
        throw new Error(`${info.layerType} type layer does not have value named ${valueKey}`);
      }

      layer.getValueWrapper(valueKey).setFromString(info.valDict[valueKey]);
    }
    return layer;
  }

  public static clone(layer: Layer): Layer {
    return Layer.fromJson(Layer.toJson(layer));
  }

  protected abstract ports: {
    [key: string]: ILayerPortInfo;
  };

  protected abstract fields: {
    [key: string]: {
      wrapper: ValueWrapper;
      readonly: boolean;
    };
  };
  protected abstract type: string;

  constructor() {
    // empty
  }

  public update(): void {
    const status = this.updateFunc();

    if (status.errors.length !== 0) {
      throw new Error(`Error updating: ${status.errors.join(",")}`);
    }
  }

  public validateUpdate(): {errors: string[]; warnings: string[]} {
    return Layer.clone(this).updateFunc();
  }

  public getType(): string {
    return this.type;
  }

  public getPortIds(): string[] {
    return Object.keys(this.ports);
  }

  public getFieldIds(): string[] {
    return Object.keys(this.fields);
  }

  public getPortInfo(portId: string): ILayerPortInfo {
    const portInfo = this.ports[portId];
    if (portInfo === undefined) {
      throw new Error(`No port found with id ${portId}`);
    }

    return portInfo;
  }

  public getValueWrapper(fieldKey: string): ValueWrapper {
    return this.fields[fieldKey].wrapper;
  }

  public isReadonlyField(fieldKey: string): boolean {
    return this.fields[fieldKey].readonly;
  }

  public hasField(fieldKey: string): boolean {
    return this.fields[fieldKey] !== undefined;
  }

  protected abstract updateFunc(): {errors: string[]; warnings: string[]};
}
