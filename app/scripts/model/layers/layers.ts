import {
  ValueWrapper,
  ShapeWrapper,
  NumberWrapper,
} from "./valueWrappers/valueWrapper.js";

interface LayerPortInfo {
  valueKey: string;
  type: "input" | "output";
}

const layerDict = {
  "Repeat": () => new RepeatLayer(),
  "AddLayer": () => new AddLayer(),
};

export type LayerType = keyof typeof layerDict;

export interface LayerJsonInfo {
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
    if (!Layer.isLayerType(info.layerType)) throw new Error(`Unknown layer type ${info.layerType}`);

    const layer = Layer.getLayer(info.layerType);

    for (const valueKey in info.valDict) {
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
    [key: string]: LayerPortInfo;
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

  protected abstract updateFunc(): {errors: string[]; warnings: string[]};

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

class RepeatLayer extends Layer {
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

class AddLayer extends Layer {
  protected type = "AddLayer";
  protected ports: {
    [key: string]: LayerPortInfo;
  } = {
    "inputValue1": {
      valueKey: "inputValue1",
      type: "input",
    },
    "inputValue2": {
      valueKey: "inputValue2",
      type: "input",
    },
    "outputValue": {
      valueKey: "outputShape",
      type: "output",
    },
  };

  protected fields = {
    inputValue1: {
      wrapper: new NumberWrapper(0),
      readonly: false,
    },
    inputValue2: {
      wrapper: new NumberWrapper(0),
      readonly: false,
    },
    outputShape: {
      wrapper: new NumberWrapper(0),
      readonly: true,
    },
  };

  constructor() {
    super();
  }

  protected updateFunc(): {errors: string[]; warnings: string[]} {
    const outNum = this.fields.inputValue1.wrapper.getValue() + this.fields.inputValue2.wrapper.getValue();

    const validated = this.fields.outputShape.wrapper.validateValue(outNum);
    if (validated !== null) return {errors: [`Problem adding inputs: ${validated}`], warnings: []};


    this.fields.outputShape.wrapper.setValue(outNum);
    return {errors: [], warnings: []};
  }
}
