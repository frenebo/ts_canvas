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

  public requestModelChanges(...reqs: ModelChangeRequest[]): void {
    for (const req of reqs) {
      this.requestSingleModelChange(req);
    }
    for (const listener of this.modelChangedListeners) {
      listener();
    }
  }

  private requestSingleModelChange(req: ModelChangeRequest): void {
    if (req.type === "moveVertex") {
      this.graph.moveVertex(req.vertexId, req.x, req.y);
    } else if (req.type === "createEdge") {
      this.graph.createEdge(req.newEdgeId, req.sourceVertexId, req.sourcePortId, req.targetVertexId, req.targetPortId);
    } else if (req.type === "cloneVertex") {
      this.graph.cloneVertex(req.newVertexId, req.sourceVertexId, req.x, req.y);
    } else if (req.type === "deleteVertex") {
      this.graph.deleteVertex(req.vertexId);
    } else if (req.type === "deleteEdge") {
      this.graph.deleteEdge(req.edgeId);
    } else {
      // console.log(`Unimplemented request ${req.type}`);
    }
  }

  public requestModelInfo<T extends ModelInfoRequestType>(req: ModelInfoRequestMap[T]): ModelInfoResponseMap[T] {
    if (req.type === "validateEdge") {
      const isValid = this.graph.validateEdge(
        (req as ModelInfoRequestMap["validateEdge"]).sourceVertexId,
        (req as ModelInfoRequestMap["validateEdge"]).sourcePortId,
        (req as ModelInfoRequestMap["validateEdge"]).targetVertexId,
        (req as ModelInfoRequestMap["validateEdge"]).targetPortId,
      );
      const response: ModelInfoResponseMap["validateEdge"] = {
        validity: isValid ? "valid" : "invalid",
      }
      return response;
    } else if (req.type === "edgesBetweenVertices") {
      const edgesBetweenVertices = this.graph.edgesBetweenVertices(
        (req as ModelInfoRequestMap["edgesBetweenVertices"]).vertexIds,
      );
      const response: ModelInfoResponseMap["edgesBetweenVertices"] = {
        edges: edgesBetweenVertices,
      };
      return response;
    } else {
      throw new Error(`Unimplemented request ${req.type}`)
    }
  }
}
