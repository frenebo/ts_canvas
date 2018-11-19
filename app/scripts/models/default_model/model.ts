import { ModelInterface, ModelData } from "../../interfaces";

export class DefaultModel implements ModelInterface {
  private modelData: ModelData;
  constructor() {
    this.modelData = {
      vertices: {
        "someVertex": {
          geo: {
            x: 10,
            y: 10,
            w: 100,
            h: 100,
          },
          ports: {},
        }
      },
      // edges: {},
    };
  }

  public getModelData(): ModelData {
    return JSON.parse(JSON.stringify(this.modelData));
  }
}
