import { ModelInterface, ModelData, ModelChangeRequest } from "../../interfaces.js";
import { Graph } from "./graphWrapper.js";

export class DefaultModel implements ModelInterface {
  private graph: Graph;
  private modelChangedListeners: Array<() => void> = [];
  constructor() {
    this.graph = new Graph();
  }

  public getModelData(): ModelData {
    return this.graph.getModelData();
  }

  public addModelChangedListener(listener: () => void): void {
    this.modelChangedListeners.push(listener);
  }

  public requestModelChange(req: ModelChangeRequest): void {
    if (req.type === "moveVertex") {
      this.graph.moveVertex(req.vertexId, req.x, req.y);
    } else if (req.type === "resizeVertex") {
      this.graph.resizeVertex(req.vertexId, req.w, req.h);
    } else {
      console.log(`Unimplemented request ${req}`);
    }

    for (const listener of this.modelChangedListeners) {
      listener();
    }
  }
}
