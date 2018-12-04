import { ValueWrapper, ShapeWrapper } from "./valueWrappers/valueWrapper.js";

interface LayerPortInfo {
  valueKey: string;
  type: "input" | "output";
}

type ValueDict<T extends string> = {
  [key in T]: ValueWrapper;
}

interface LayerTypes {
  "Repeat": RepeatLayer
}

export type GenericLayer = Layer<{[key: string]: ValueWrapper}>;

export type LayerJsonInfo = {
  layerType: string;
  valDict: {[key: string]: string};
};

export abstract class Layer<V extends ValueDict<string>> {
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
  public static toJson(layer: GenericLayer): LayerJsonInfo {
    const info: LayerJsonInfo = {
      layerType: layer.getType(),
      valDict: {},
    };
    for (const valueKey in layer.valueWrappers) {
      info.valDict[valueKey] = layer.valueWrappers[valueKey].stringify();
    }
    return info;
  }

  public static fromJson(info: LayerJsonInfo): Layer<{[key: string]: ValueWrapper}> {
    if (!Layer.isLayerType(info.layerType)) throw new Error(`Unknown layer type ${info.layerType}`)

    const layer = Layer.getLayer(info.layerType);

    for (const valueKey in info.valDict) {
      if (!layer.hasValueWrapper(valueKey)) throw new Error(`${info.layerType} type layer does not have value named ${valueKey}`);

      layer.getValueWrapper(valueKey).setFromString(info.valDict[valueKey]);
    }
    return layer;
  }

  protected abstract ports: {
    [key: string]: LayerPortInfo;
  };

  protected abstract valueWrappers: V;
  protected abstract type: string;

  constructor() {

  }

  public getType(): string {
    return this.type;
  }

  public getPortIds(): string[] {
    return Object.keys(this.ports);
  }

  public getValueIds(): string[] {
    return Object.keys(this.valueWrappers);
  }

  public getPortInfo(portId: string): LayerPortInfo {
    const portInfo = this.ports[portId];
    if (portInfo === undefined) throw new Error(`No port found with id ${portId}`);

    return portInfo;
  }

  public getValueWrapper<T extends keyof V>(value: T): V[T] {
    return this.valueWrappers[value];
  }

  public hasValueWrapper(value: string | keyof V): value is keyof V {
    return this.valueWrappers[value] !== undefined;
  }
}

export class RepeatLayer extends Layer<{
  inputShape: ShapeWrapper;
  outputShape: ShapeWrapper;
}> {
  protected type = "Repeat";
  protected ports: { [key: string]: LayerPortInfo } = {
    "input0": {
      valueKey: "inputShape",
      type: "input",
    },
    "output0": {
      valueKey: "outputShape",
      type: "output",
    },
  };

  protected valueWrappers = {
    inputShape: new ShapeWrapper([224, 224, 3]),
    outputShape: new ShapeWrapper([224, 224, 3]),
  };

  constructor() {
    super();
  }
}
