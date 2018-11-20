import { ModelInterface, ModelData, ModelChangeRequest, ModelInfoRequestMap, ModelInfoRequestType, ModelInfoResponseMap } from "../../interfaces.js";
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
    } else if (req.type === "createEdge") {
      this.graph.createEdge(req.newPortId, req.sourceVertexId, req.sourcePortId, req.targetVertexId, req.targetPortId);
    } else {
      console.log(`Unimplemented request ${req.type}`);
    }

    for (const listener of this.modelChangedListeners) {
      listener();
    }
  }

  public requestModelInfo<T extends ModelInfoRequestType>(req: ModelInfoRequestMap[T]): ModelInfoResponseMap[T] {
    if (req.type === "validateEdge") {
      const isValid = this.graph.validateEdge(req.sourceVertexId, req.sourcePortId, req.targetVertexId, req.targetPortId);
      const response: ModelInfoResponseMap["validateEdge"] = {
        validity: isValid ? "valid" : "invalid",
      }
      return response;
    } else {
      throw new Error(`Unimplemented request ${req.type}`)
    }
  }
}
