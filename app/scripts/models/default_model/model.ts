import {
  ModelInterface, GraphData, ModelChangeRequest, ModelInfoRequestMap, ModelInfoRequestType, ModelInfoResponseMap,
  ModelVersioningRequest, LayerDataDict, DeepReadonly,
} from "../../interfaces.js";
import { GraphUtils, EdgesByVertex } from "./graphUtils.js";
import { Diffable, DiffType, createDiff } from "../../diff.js";
import { SaveUtils } from "./saveUtils.js";
import { VersioningUtils } from "./versioningUtils.js";
import { LayerUtils, LayerClassDict } from "./layers/layerUtils.js";
import { Layer } from "./layers/layers.js";
import { SessionUtils, SessionDataJson } from "./sessionUtils.js";

export interface ModelDataObj {
  graph: GraphData;
  layers: LayerClassDict;
  edgesByVertex: EdgesByVertex;
}

export interface SessionData {
  data: ModelDataObj;
  pastDiffs: Array<DiffType<SessionDataJson & Diffable>>;
  futureDiffs: Array<DiffType<SessionDataJson & Diffable>>;
  openFile: null | {
    fileName: string;
    fileIdxInHistory: number | null;
  }
}

export class DefaultModel implements ModelInterface {
  private readonly graphChangedListeners: Array<() => void> = [];
  private readonly layerDataDictChangedListeners: Array<() => void> = [];

  private session: SessionData = {
    data: {
      graph: {
        vertices: {},
        edges: {},
      },
      layers: {},
      edgesByVertex: {},
    },
    pastDiffs: [],
    futureDiffs: [],
    openFile: null,
  };

  constructor() {
    for (let i = 0; i < 3; i++) {
      const layer = Layer.getLayer("RepeatLayer");
      LayerUtils.addLayer(
        this.session.data.layers,
        i.toString(),
        layer,
      );
      const vertex = GraphUtils.createVertexFromLayer(
        layer,
        i*100,
        i*100,
      );
      GraphUtils.addVertex(
        this.session.data.graph,
        this.session.data.edgesByVertex,
        i.toString(),
        vertex,
      );
      // LayerUtils.createLayer(
      //   this.session.data.layers,
      //   i.toString(),
      //   "RepeatLayer",
      // );
      // GraphUtils.createVertex(this.session.data.graph, this.session.data.edgesByVertex, i.toString(), {
      //   label: i.toString(),
      //   geo: {
      //     x: i*100,
      //     y: i*100,
      //   },
      //   ports: {
      //     "port0": {
      //       portType: "input",
      //       side: "top",
      //       position: 0.5,
      //     },
      //     "port2": {
      //       portType: "output",
      //       side: "bottom",
      //       position: 0.5,
      //     },
      //   },
      // });
    }
  }

  public getGraphData(): DeepReadonly<GraphData> {
    return this.session.data.graph;
  }

  public getLayerDataDict(): DeepReadonly<LayerDataDict> {
    return LayerUtils.getLayerDataDict(this.session.data.layers);
  }

  public addGraphChangedListener(listener: () => void): void {
    this.graphChangedListeners.push(listener);
  }

  public addLayerDataDictChangedListener(listener: () => void): void {
    this.layerDataDictChangedListeners.push(listener);
  }

  public requestModelChanges(...reqs: ModelChangeRequest[]): void {

    const beforeChange = SessionUtils.toJson(this.session.data) as unknown as Diffable;

    for (const req of reqs) {
      this.requestSingleModelChange(req);
    }

    const changeDiff = createDiff(beforeChange, SessionUtils.toJson(this.session.data) as unknown as Diffable);
    this.session.pastDiffs.push(changeDiff as DiffType<SessionDataJson & Diffable>);

    if (this.session.openFile !== null) {
      // if the save file is ahead of the current data, set fileIdxInHistory to null
      if (
        this.session.futureDiffs.length !== 0 &&
        this.session.openFile.fileIdxInHistory !== null &&
        this.session.openFile.fileIdxInHistory < 0
      ) {
        this.session.openFile.fileIdxInHistory = null;
      }

      if (typeof this.session.openFile.fileIdxInHistory === "number") {
        this.session.openFile.fileIdxInHistory++;
      }
    }
    this.session.futureDiffs = []; // redos are lost when model is changed

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
      LayerUtils.cloneLayer(
        this.session.data.layers,
        req.sourceVertexId,
        req.newVertexId,
      );
    } else if (req.type === "deleteVertex") {
      GraphUtils.deleteVertex(
        this.session.data.graph,
        this.session.data.edgesByVertex,
        req.vertexId,
      );
      LayerUtils.deleteLayer(
        this.session.data.layers,
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
      VersioningUtils.undo(this.session);
    } else if (req.type === "redo") {
      VersioningUtils.redo(this.session);
    } else if (req.type === "saveFile") {
      SaveUtils.saveFile(req.fileName, this.session);
    } else if (req.type === "openFile") {
      SaveUtils.openFile(req.fileName, this.session);
    } else if (req.type === "deleteFile") {
      SaveUtils.deleteFile(req.fileName, this.session);
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
      const response: ModelInfoResponseMap["fileIsOpen"] = this.session.openFile === null ? {
          fileIsOpen: false,
        } : {
          fileIsOpen: true,
          fileName: this.session.openFile.fileName,
          fileIsUpToDate: this.session.openFile.fileIdxInHistory === 0,
        };

      return response;
    } else if (req.type === "savedFileNames") {
      const response: ModelInfoResponseMap["savedFileNames"] = {
        fileNames: SaveUtils.savedFileNames(),
      };
      return response;
    } else if (req.type === "getPortInfo") {
      const info = LayerUtils.getPortInfo(
        this.session.data.layers,
        (req as ModelInfoRequestMap["getPortInfo"]).portId,
        (req as ModelInfoRequestMap["getPortInfo"]).vertexId,
      );
      const response: ModelInfoResponseMap["getPortInfo"] = {
        couldFindPort: true,
        portValue: info.portValue
      }
      return response;
    } else {
      throw new Error(`Unimplemented request ${req.type}`);
    }
  }
}
