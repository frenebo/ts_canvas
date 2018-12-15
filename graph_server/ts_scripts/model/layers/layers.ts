import { IServerUtils } from "../server_utils/server_utils.js";
import { NumberWrapper } from "../valueWrappers/numberWrapper.js";
import { ShapeWrapper } from "../valueWrappers/shapeWrapper.js";
import { ValueWrapper } from "../valueWrappers/valueWrapper.js";

/* tslint:disable:max-classes-per-file */

export interface ILayerPortInfo {
  valueKey: string;
  type: "input" | "output";
}

const layerDict = {
  "AddLayer": (serverUtils: IServerUtils) => new AddLayer(serverUtils),
  "Conv2D": (serverUtils: IServerUtils) => new Conv2DLayer(serverUtils),
  "Repeat": (serverUtils: IServerUtils) => new RepeatLayer(serverUtils),
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

  public static getLayer<T extends LayerType>(type: T, serverUtils: IServerUtils): ReturnType<(typeof layerDict)[T]> {
    const layerConstructor = layerDict[type];
    return layerConstructor(serverUtils) as ReturnType<(typeof layerDict)[T]>;
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

  public static fromJson(info: ILayerJsonInfo, serverUtils: IServerUtils): Layer {
    if (!Layer.isLayerType(info.layerType)) {
      throw new Error(`Unknown layer type ${info.layerType}`);
    }

    const layer = Layer.getLayer(info.layerType, serverUtils);

    for (const valueKey of Object.keys(info.valDict)) {
      if (!layer.hasField(valueKey)) {
        throw new Error(`${info.layerType} type layer does not have value named ${valueKey}`);
      }

      layer.getValueWrapper(valueKey).setFromString(info.valDict[valueKey]);
    }
    return layer;
  }

  public static clone(layer: Layer): Layer {
    return Layer.fromJson(Layer.toJson(layer), layer.serverUtils);
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

  constructor(
    protected readonly serverUtils: IServerUtils,
  ) {

  }

  public async update(): Promise<void> {
    const status = await this.updateFunc();

    if (status.errors.length !== 0) {
      throw new Error(`Error updating: ${status.errors.join(",")}`);
    }
  }

  public async validateUpdate(): Promise<{errors: string[]; warnings: string[]}> {
    return await Layer.clone(this).updateFunc();
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

  protected abstract updateFunc(): Promise<{errors: string[]; warnings: string[]}>;
}

export class AddLayer extends Layer {
  protected type = "AddLayer";
  protected ports: {
    [key: string]: ILayerPortInfo;
  } = {
    inputValue1: {
      type: "input",
      valueKey: "inputValue1",
    },
    inputValue2: {
      type: "input",
      valueKey: "inputValue2",
    },
    outputValue: {
      type: "output",
      valueKey: "outputShape",
    },
  };

  protected fields = {
    inputValue1: {
    readonly: false,
      wrapper: new NumberWrapper(0),
    },
    inputValue2: {
    readonly: false,
      wrapper: new NumberWrapper(0),
    },
    outputShape: {
    readonly: true,
      wrapper: new NumberWrapper(0),
    },
  };

  protected async updateFunc() {
    const outNum = this.fields.inputValue1.wrapper.getValue() + this.fields.inputValue2.wrapper.getValue();

    const validated = this.fields.outputShape.wrapper.validateValue(outNum);
    if (validated !== null) {
      return {errors: [`Problem adding inputs: ${validated}`], warnings: []};
    }

    this.fields.outputShape.wrapper.setValue(outNum);
    return {errors: [], warnings: []};
  }
}

export class Conv2DLayer extends Layer {
  protected type = "Conv2D";
  protected ports: {
    [key: string]: ILayerPortInfo;
  } = {
    "inputShape": {
      type: "input",
      valueKey: "inputShape",
    },
    "outputShape": {
      type: "output",
      valueKey: "outputShape",
    },
  };

  protected fields = {
    inputShape: {
      readonly: false,
      wrapper: new ShapeWrapper([224, 224, 3], {
        dimConstraints: {
          type: "equals",
          value: 3,
        },
      }),
    },
    kernelShape: {
      readonly: false,
      wrapper: new ShapeWrapper([1, 1], {
        dimConstraints: {
          type: "equals",
          value: 2,
        },
      }),
    },
    filters: {
      readonly: false,
      wrapper: new NumberWrapper(3, {
        requireInteger: true,
        lowerBound: {inclusive: true, val: 1},
      }),
    },
    outputShape: {
      readonly: true,
      wrapper: new ShapeWrapper([224, 224, 3]),
    },
  };

  protected async updateFunc() {
    const inputShape = this.fields.inputShape.wrapper.getValue();
    const kernelShape = this.fields.kernelShape.wrapper.getValue();
    const filters = this.fields.filters.wrapper.getValue();

    const getFieldInfo = await this.serverUtils.makeLayerInfoReq<"getConv2dFields">({
      fields: {
        input_shape: inputShape,
        kernel_size: kernelShape,
        filters: filters,
      },
      type: "getConv2dFields",
    });

    if (!getFieldInfo.success) {
      return {errors: [getFieldInfo.error_type], warnings: []}
    }

    const outputShape = getFieldInfo.response.fields.output_shape;
    process.stderr.write(JSON.stringify(outputShape) + "\n");

    const validatedOutput = this.fields.outputShape.wrapper.validateValue(outputShape);
    if (validatedOutput !== null) {
      return {
        errors: ["Could not calculate output shape"],
        warnings: [],
      };
    }
    this.fields.outputShape.wrapper.setValue(outputShape);

    return {errors: [], warnings: []};
  }
}

export class RepeatLayer extends Layer {
  protected type = "Repeat";
  protected ports: {
    [key: string]: ILayerPortInfo;
  } = {
    "input0": {
      type: "input",
      valueKey: "inputShape",
    },
    "output0": {
      type: "output",
      valueKey: "outputShape",
    },
  };

  protected fields = {
    inputShape: {
      readonly: false,
      wrapper: new ShapeWrapper([224, 224, 3]),
    },
    outputShape: {
      readonly: true,
      wrapper: new ShapeWrapper([224, 224, 3]),
    },
  };

  protected async updateFunc() {
    const inputShape = this.fields.inputShape.wrapper.getValue();

    this.fields.outputShape.wrapper.setValue(inputShape);

    return {errors: [], warnings: []};
  }
}
