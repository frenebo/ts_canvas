import {
  ValueWrapper,
  ShapeWrapper
} from "./valueWrappers/valueWrapper.js";

interface LayerPortInfo {
  valueKey: string;
  type: "input" | "output";
}

interface LayerTypes {
  "Repeat": RepeatLayer
}

export type LayerJsonInfo = {
  layerType: string;
  valDict: {[key: string]: string};
};

export abstract class Layer {
  private static layerConstructorDict: LayerTypes | null = null;
  public static isLayerType(type: string): type is keyof LayerTypes {
    if (Layer.layerConstructorDict === null) {
      Layer.layerConstructorDict = {
        "Repeat": new RepeatLayer(),
      };
    }

    return Object.keys(Layer.layerConstructorDict).indexOf(type) !== -1;
  }
  public static getLayer<T extends keyof LayerTypes>(type: T): LayerTypes[T] {
    if (type === "Repeat") {
      return new RepeatLayer();
    } else {
      throw new Error("unimplemented layer")
    }
  }
  public static toJson(layer: Layer): LayerJsonInfo {
    const info: LayerJsonInfo = {
      layerType: layer.getType(),
      valDict: {},
    };
    for (const valueKey in layer.fields) {
      info.valDict[valueKey] = layer.fields[valueKey].wrapper.stringify();
    }
    return info;
  }

  public static fromJson(info: LayerJsonInfo): Layer {
    if (!Layer.isLayerType(info.layerType)) throw new Error(`Unknown layer type ${info.layerType}`)

    const layer = Layer.getLayer(info.layerType);

    for (const valueKey in info.valDict) {
      if (!layer.hasField(valueKey)) throw new Error(`${info.layerType} type layer does not have value named ${valueKey}`);

      layer.getValueWrapper(valueKey).setFromString(info.valDict[valueKey]);
    }
    return layer;
  }

  public static clone(layer: Layer): Layer {
    return Layer.fromJson(Layer.toJson(layer));
  }

  protected abstract ports: {
    [key: string]: LayerPortInfo;
  };

  protected abstract fields: {
    [key: string]: {
      wrapper: ValueWrapper;
      readonly: boolean;
    }
  };
  protected abstract type: string;

  constructor() {

  }

  public update(): void {
    const status = this.updateFunc();

    if (status.errors.length !== 0) throw new Error(`Error updating: ${status.errors.join(",")}`);
  }

  public validateUpdate(): {errors: string[], warnings: string[]} {
    return Layer.clone(this).updateFunc();
  }

  protected abstract updateFunc(): {errors: string[], warnings: string[]};

  public getType(): string {
    return this.type;
  }

  public getPortIds(): string[] {
    return Object.keys(this.ports);
  }

  public getFieldIds(): string[] {
    return Object.keys(this.fields);
  }

  public getPortInfo(portId: string): LayerPortInfo {
    const portInfo = this.ports[portId];
    if (portInfo === undefined) throw new Error(`No port found with id ${portId}`);

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
}

export class RepeatLayer extends Layer {
  protected type = "Repeat";
  protected ports: {
    [key: string]: LayerPortInfo;
  } = {
    "input0": {
      valueKey: "inputShape",
      type: "input",
    },
    "output0": {
      valueKey: "outputShape",
      type: "output",
    },
  };

  protected fields = {
    inputShape: {
      wrapper: new ShapeWrapper([224, 224, 3]),
      readonly: false,
    },
    outputShape: {
      wrapper: new ShapeWrapper([224, 224, 3]),
      readonly: true,
    },
  };

  constructor() {
    super();
  }

  public updateFunc() {
    const inputShape = this.fields.inputShape.wrapper.getValue();
    this.fields.outputShape.wrapper.setValue(inputShape);

    return {errors: [], warnings: []};
  }
}
