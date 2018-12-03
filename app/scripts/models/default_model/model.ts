import {
  ModelInterface, GraphData, ModelChangeRequest, ModelInfoRequestMap, ModelInfoRequestType, ModelInfoResponseMap,
  ModelVersioningRequest, LayerDataDict, DeepReadonly,
} from "../../interfaces.js";
import { GraphUtils, AugmentedGraphData } from "./graphUtils.js";
import { Diffable, DiffType, applyDiff, createDiff, undoDiff } from "../../diff.js";
import { SaveUtils } from "./saveUtils.js";

export interface ModelDataObj {
  graph: AugmentedGraphData;
  layers: LayerDataDict;
}

export class DefaultModel implements ModelInterface {
  private readonly pastDiffs: Array<DiffType<ModelDataObj & Diffable>> = [];
  private futureDiffs: Array<DiffType<ModelDataObj & Diffable>> = [];
  private readonly graphChangedListeners: Array<() => void> = [];
  private readonly layerDataDictChangedListeners: Array<() => void> = [];

  private openFileName: string | null = null;
  private modelData: ModelDataObj = {graph: {g: {vertices: {}, edges: {}}, edgesByVertex: {}}, layers: {}};

  constructor() {
    for (let i = 0; i < 3; i++) {
      GraphUtils.createVertex(this.modelData.graph, i.toString(), {
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
          "port2": {
            portType: "output",
            side: "bottom",
            position: 0.5,
          },
        },
      });
    }
  }

  public getGraphData(): DeepReadonly<GraphData> {
    return this.modelData.graph.g;
  }

  public getLayerDataDict(): DeepReadonly<LayerDataDict> {
    return this.modelData.layers;
  }

  public addGraphChangedListener(listener: () => void): void {
    this.graphChangedListeners.push(listener);
  }

  public addLayerDataDictChangedListener(listener: () => void): void {
    this.layerDataDictChangedListeners.push(listener);
  }

  public requestModelChanges(...reqs: ModelChangeRequest[]): void {
    this.futureDiffs = []; // redos are lost when model is changed

    const beforeChange: GraphData = JSON.parse(JSON.stringify(this.modelData));

    for (const req of reqs) {
      this.requestSingleModelChange(req);
    }

    const changeDiff = createDiff(beforeChange as unknown as Diffable, this.modelData as unknown as Diffable);
    this.pastDiffs.push(changeDiff as DiffType<ModelDataObj & Diffable>);

    for (const listener of this.graphChangedListeners) {
      listener();
    }
  }

  private requestSingleModelChange(req: ModelChangeRequest): void {
    if (req.type === "moveVertex") {
      GraphUtils.moveVertex(this.modelData.graph, req.vertexId, req.x, req.y);
    } else if (req.type === "createEdge") {
      GraphUtils.createEdge(
        this.modelData.graph,
        req.newEdgeId,
        req.sourceVertexId,
        req.sourcePortId,
        req.targetVertexId,
        req.targetPortId,
      );
    } else if (req.type === "cloneVertex") {
      GraphUtils.cloneVertex(this.modelData.graph, req.newVertexId, req.sourceVertexId, req.x, req.y);
    } else if (req.type === "deleteVertex") {
      GraphUtils.deleteVertex(this.modelData.graph, req.vertexId);
    } else if (req.type === "deleteEdge") {
      GraphUtils.deleteEdge(this.modelData.graph, req.edgeId);
    } else {
      // console.log(`Unimplemented request ${req.type}`);
    }
  }

  public requestVersioningChange(req: ModelVersioningRequest): void {
    if (req.type === "undo") {
      if (this.pastDiffs.length === 0) return;
      const pastDiff = this.pastDiffs.pop()!;

      const newData = undoDiff(this.modelData as unknown as Diffable, pastDiff) as unknown as ModelDataObj;

      this.futureDiffs.splice(0, 0, pastDiff);

      this.modelData = newData;
    } else if (req.type === "redo") {
      if (this.futureDiffs.length === 0) return;
      const redoDiff = this.futureDiffs.splice(0, 1)[0];

      const newData = applyDiff(this.modelData as unknown as Diffable, redoDiff) as unknown as ModelDataObj;

      this.pastDiffs.push(redoDiff);

      this.modelData = newData;
    } else if (req.type === "saveFile") {
      SaveUtils.saveFile(req.fileName, this.modelData);
      this.openFileName = req.fileName;
    } else if (req.type === "openFile") {
      const modelDataOrNull = SaveUtils.openFile(req.fileName);
      if (modelDataOrNull !== null) {
        this.modelData = modelDataOrNull;
        this.openFileName = req.fileName;
      }
    } else if (req.type === "deleteFile") {
      SaveUtils.deleteFile(req.fileName);
      if (this.openFileName === req.fileName) {
        this.openFileName = null;
      }
    } else {
      throw new Error("unimplemented");
    }
    for (const listener of this.graphChangedListeners) {
      listener();
    }
  }

  public requestModelInfo<T extends ModelInfoRequestType>(req: ModelInfoRequestMap[T]): ModelInfoResponseMap[T] {
    if (req.type === "validateEdge") {
      const isValid = GraphUtils.validateEdge(
        this.modelData.graph,
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
        this.modelData.graph,
        (req as ModelInfoRequestMap["edgesBetweenVertices"]).vertexIds,
      );
      const response: ModelInfoResponseMap["edgesBetweenVertices"] = {
        edges: edgesBetweenVertices,
      };
      return response;
    } else if (req.type === "fileIsOpen") {
      const response: ModelInfoResponseMap["fileIsOpen"] =
        this.openFileName == null ? {fileIsOpen: false} : {fileIsOpen: true, fileName: this.openFileName}

      return response;
    } else if (req.type === "savedFileNames") {
      const response: ModelInfoResponseMap["savedFileNames"] = {
        fileNames: SaveUtils.savedFileNames(),
      };
      return response;
    } else {
      throw new Error(`Unimplemented request ${req.type}`);
    }
  }
}
