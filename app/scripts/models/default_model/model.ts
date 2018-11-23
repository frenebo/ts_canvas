import {
  ModelInterface, ModelData, ModelChangeRequest, ModelInfoRequestMap, ModelInfoRequestType, ModelInfoResponseMap, ModelVersioningRequest,
} from "../../interfaces.js";
import { GraphUtils } from "./graphUtils.js";
import { Diffable, DiffType, applyDiff, createDiff, undoDiff } from "../../diff.js";

export class DefaultModel implements ModelInterface {
  private pastDiffs: Array<DiffType<ModelData & Diffable>> = [];
  private futureDiffs: Array<DiffType<ModelData & Diffable>> = [];
  private readonly modelChangedListeners: Array<() => void> = [];
  private modelData: ModelData = {vertices: {}, edges: {}};
  constructor() {
    for (let i = 0; i < 3; i++) {
      this.modelData.vertices[i.toString()] = {
        label: i.toString(),
        geo: {
          x: i*100,
          y: i*100,
        },
        ports: {
          "port0": {
            portType: "input",
            side: "top",
            position: 0.5,
          },
          "port1": {
            portType: "output",
            side: "bottom",
            position: 0.5,
          },
        }
      }

      if (i !== 0) {
        this.modelData.edges[i.toString()] = {
          sourceVertexId: (i - 1).toString(),
          sourcePortId: "port1",
          targetVertexId: i.toString(),
          targetPortId: "port0",
        }
      }
    }
  }

  public getModelData(): ModelData {
    return JSON.parse(JSON.stringify(this.modelData));
  }

  public addModelChangedListener(listener: () => void): void {
    this.modelChangedListeners.push(listener);
  }

  public requestModelChanges(...reqs: ModelChangeRequest[]): void {
    this.futureDiffs = []; // redos are lost when model is changed

    const beforeChange: ModelData = JSON.parse(JSON.stringify(this.modelData));

    for (const req of reqs) {
      this.requestSingleModelChange(req);
    }

    const changeDiff = createDiff(beforeChange as unknown as Diffable, this.modelData as unknown as Diffable);
    this.pastDiffs.push(changeDiff as DiffType<ModelData & Diffable>);

    for (const listener of this.modelChangedListeners) {
      listener();
    }
  }

  private requestSingleModelChange(req: ModelChangeRequest): void {
    if (req.type === "moveVertex") {
      GraphUtils.moveVertex(this.modelData, req.vertexId, req.x, req.y);
    } else if (req.type === "createEdge") {
      GraphUtils.createEdge(this.modelData, req.newEdgeId, req.sourceVertexId, req.sourcePortId, req.targetVertexId, req.targetPortId);
    } else if (req.type === "cloneVertex") {
      GraphUtils.cloneVertex(this.modelData, req.newVertexId, req.sourceVertexId, req.x, req.y);
    } else if (req.type === "deleteVertex") {
      GraphUtils.deleteVertex(this.modelData, req.vertexId);
    } else if (req.type === "deleteEdge") {
      GraphUtils.deleteEdge(this.modelData, req.edgeId);
    } else {
      // console.log(`Unimplemented request ${req.type}`);
    }
  }

  public requestVersioningChange(req: ModelVersioningRequest): void {
    if (req.type === "undo") {
      if (this.pastDiffs.length === 0) return;
      const pastDiff = this.pastDiffs.pop()!;

      const newData = undoDiff(this.modelData as unknown as Diffable, pastDiff) as unknown as ModelData;

      this.futureDiffs.splice(0, 0, pastDiff);

      this.modelData = newData;
    } else if (req.type === "redo") {
      if (this.futureDiffs.length === 0) return;
      const redoDiff = this.futureDiffs.splice(0, 1)[0];

      const newData = applyDiff(this.modelData as unknown as Diffable, redoDiff) as unknown as ModelData;

      this.pastDiffs.push(redoDiff);

      this.modelData = newData;
    } else {

    }
    for (const listener of this.modelChangedListeners) {
      listener();
    }
  }

  public requestModelInfo<T extends ModelInfoRequestType>(req: ModelInfoRequestMap[T]): ModelInfoResponseMap[T] {
    if (req.type === "validateEdge") {
      const isValid = GraphUtils.validateEdge(
        this.modelData,
        (req as ModelInfoRequestMap["validateEdge"]).sourceVertexId,
        (req as ModelInfoRequestMap["validateEdge"]).sourcePortId,
        (req as ModelInfoRequestMap["validateEdge"]).targetVertexId,
        (req as ModelInfoRequestMap["validateEdge"]).targetPortId,
      );
      const response: ModelInfoResponseMap["validateEdge"] = {
        validity: isValid ? "valid" : "invalid",
      };
      return response;
    } else if (req.type === "edgesBetweenVertices") {
      const edgesBetweenVertices = GraphUtils.edgesBetweenVertices(
        this.modelData,
        (req as ModelInfoRequestMap["edgesBetweenVertices"]).vertexIds,
      );
      const response: ModelInfoResponseMap["edgesBetweenVertices"] = {
        edges: edgesBetweenVertices,
      };
      return response;
    } else {
      throw new Error(`Unimplemented request ${req.type}`);
    }
  }
}
