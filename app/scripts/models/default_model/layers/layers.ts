import { ValueWrapper, ShapeWrapper } from "./valueWrappers/valueWrapper";

interface LayerPortInfo {
  valueKey: string;
  type: "input" | "output";
}

type ValueDict<T extends string> = {
  [key in T]: ValueWrapper;
}

export abstract class Layer {
  protected abstract ports: {
    [key: string]: LayerPortInfo;
  };

  protected abstract values: ValueDict<string>;

  constructor() {

  }
}

class RepeatLayer extends Layer {
  protected ports: { [key: string]: LayerPortInfo } = {
    "input0": {
      valueKey: "inputShape",
      type: "input",
    },
  };

  protected values = {
    inputShape: new ShapeWrapper([224, 224, 3]),
  };

  constructor() {
    super();
  }
}
