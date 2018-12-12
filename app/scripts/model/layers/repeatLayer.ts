import { ShapeWrapper } from "../valueWrappers/shapeWrapper.js";
import {
  ILayerPortInfo,
  Layer,
} from "./layers.js";

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

  constructor() {
    super();
  }

  public updateFunc() {
    const inputShape = this.fields.inputShape.wrapper.getValue();
    this.fields.outputShape.wrapper.setValue(inputShape);

    return {errors: [], warnings: []};
  }
}
