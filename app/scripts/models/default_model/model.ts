import {
  ModelInterface, GraphData, ModelChangeRequest, ModelInfoRequestMap, ModelInfoRequestType, ModelInfoResponseMap,
  ModelVersioningRequest, LayerDataDict, DeepReadonly,
} from "../../interfaces.js";
import { GraphUtils, EdgesByVertex } from "./graphUtils.js";
import { Diffable, DiffType, applyDiff, createDiff, undoDiff } from "../../diff.js";
import { SaveUtils } from "./saveUtils.js";

export interface ModelDataObj {
  graph: GraphData;
  layers: LayerDataDict;
  edgesByVertex: EdgesByVertex;
}

interface SessionData {
  data: ModelDataObj;
}

export class DefaultModel implements ModelInterface {
  private readonly pastDiffs: Array<DiffType<ModelDataObj & Diffable>> = [];
  private futureDiffs: Array<DiffType<ModelDataObj & Diffable>> = [];
  private readonly graphChangedListeners: Array<() => void> = [];
  private readonly layerDataDictChangedListeners: Array<() => void> = [];

  private openFileName: string | null = null;
  private fileIsUpToDate = false;
  private session: SessionData = {
    data: {
      graph: {
        vertices: {},
        edges: {},
      },
      layers: {},
      edgesByVertex: {},
    },
  };

  constructor() {
    for (let i = 0; i < 3; i++) {
      GraphUtils.createVertex(this.session.data.graph, this.session.data.edgesByVertex, i.toString(), {
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
    return this.session.data.graph;
  }

  public getLayerDataDict(): DeepReadonly<LayerDataDict> {
    return this.session.data.layers;
  }

  public addGraphChangedListener(listener: () => void): void {
    this.graphChangedListeners.push(listener);
  }

  public addLayerDataDictChangedListener(listener: () => void): void {
    this.layerDataDictChangedListeners.push(listener);
  }

  public requestModelChanges(...reqs: ModelChangeRequest[]): void {
    this.futureDiffs = []; // redos are lost when model is changed

    const beforeChange = JSON.parse(JSON.stringify(this.session.data));

    for (const req of reqs) {
      this.requestSingleModelChange(req);
    }

    const changeDiff = createDiff(beforeChange, this.session.data as unknown as Diffable);
    this.pastDiffs.push(changeDiff as DiffType<ModelDataObj & Diffable>);
    this.fileIsUpToDate = false;

    for (const listener of this.graphChangedListeners) {
      listener();
    }
  }

  private requestSingleModelChange(req: ModelChangeRequest): void {
    if (req.type === "moveVertex") {
      GraphUtils.moveVertex(
        this.session.data.graph,
        this.session.data.edgesByVertex,
        req.vertexId,
        req.x,
        req.y,
      );
    } else if (req.type === "createEdge") {
      GraphUtils.createEdge(
        this.session.data.graph,
        this.session.data.edgesByVertex,
        req.newEdgeId,
        req.sourceVertexId,
        req.sourcePortId,
        req.targetVertexId,
        req.targetPortId,
      );
    } else if (req.type === "cloneVertex") {
      GraphUtils.cloneVertex(
        this.session.data.graph,
        this.session.data.edgesByVertex,
        req.newVertexId,
        req.sourceVertexId,
        req.x,
        req.y,
      );
    } else if (req.type === "deleteVertex") {
      GraphUtils.deleteVertex(
        this.session.data.graph,
        this.session.data.edgesByVertex,
        req.vertexId,
      );
    } else if (req.type === "deleteEdge") {
      GraphUtils.deleteEdge(
        this.session.data.graph,
        this.session.data.edgesByVertex,
        req.edgeId,
      );
    } else {
      // console.log(`Unimplemented request ${req.type}`);
    }
  }

  public requestVersioningChange(req: ModelVersioningRequest): void {
    if (req.type === "undo") {
      if (this.pastDiffs.length === 0) return;
      const pastDiff = this.pastDiffs.pop()!;

      const newData = undoDiff(this.session.data as unknown as Diffable, pastDiff) as unknown as ModelDataObj;

      this.futureDiffs.splice(0, 0, pastDiff);

      this.session.data = newData;
    } else if (req.type === "redo") {
      if (this.futureDiffs.length === 0) return;
      const redoDiff = this.futureDiffs.splice(0, 1)[0];

      const newData = applyDiff(this.session.data as unknown as Diffable, redoDiff) as unknown as ModelDataObj;

      this.pastDiffs.push(redoDiff);

      this.session.data = newData;
    } else if (req.type === "saveFile") {
      SaveUtils.saveFile(req.fileName, this.session.data);
      this.openFileName = req.fileName;
      this.fileIsUpToDate = true;
    } else if (req.type === "openFile") {
      const modelDataOrNull = SaveUtils.openFile(req.fileName);
      if (modelDataOrNull !== null) {
        this.session.data = modelDataOrNull;
        this.openFileName = req.fileName;
        this.fileIsUpToDate = true;
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
        this.session.data.graph,
        this.session.data.edgesByVertex,
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
        this.session.data.graph,
        this.session.data.edgesByVertex,
        (req as ModelInfoRequestMap["edgesBetweenVertices"]).vertexIds,
      );
      const response: ModelInfoResponseMap["edgesBetweenVertices"] = {
        edges: edgesBetweenVertices,
      };
      return response;
    } else if (req.type === "fileIsOpen") {
      const response: ModelInfoResponseMap["fileIsOpen"] = this.openFileName === null ? {
          fileIsOpen: false,
        } : {
          fileIsOpen: true,
          fileName: this.openFileName,
          fileIsUpToDate: this.fileIsUpToDate,
        };

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
