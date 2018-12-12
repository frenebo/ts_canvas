import { NumberWrapper } from "../valueWrappers/numberWrapper.js";
import {
  ILayerPortInfo,
  Layer,
} from "./layers.js";

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

  constructor() {
    super();
  }

  protected updateFunc(): {errors: string[]; warnings: string[]} {
    const outNum = this.fields.inputValue1.wrapper.getValue() + this.fields.inputValue2.wrapper.getValue();

    const validated = this.fields.outputShape.wrapper.validateValue(outNum);
    if (validated !== null) {
      return {errors: [`Problem adding inputs: ${validated}`], warnings: []};
    }

    this.fields.outputShape.wrapper.setValue(outNum);
    return {errors: [], warnings: []};
  }
}
