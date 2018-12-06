import {
  ModelInterface, GraphData, ModelChangeRequest, ModelInfoRequestMap, ModelInfoRequestType, ModelInfoResponseMap,
  ModelVersioningRequest, DeepReadonly, LayerData,
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
      const layer = Layer.getLayer("Repeat");
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
    }
  }

  public getGraphData(): DeepReadonly<GraphData> {
    return this.session.data.graph;
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

    if (changeDiff !== null) {
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
  }

  private requestSingleModelChange(req: ModelChangeRequest): void {
    if (req.type === "moveVertex") {
      if (GraphUtils.validateMoveVertex(
        this.session.data.graph,
        req.vertexId,
        req.x,
        req.y,
      ) === null) {
        GraphUtils.moveVertex(
          this.session.data.graph,
          req.vertexId,
          req.x,
          req.y,
        );
      }
    } else if (req.type === "createEdge") {
      if (SessionUtils.validateCreateEdge(
        this.session.data.graph,
        this.session.data.edgesByVertex,
        this.session.data.layers,
        req.newEdgeId,
        req.sourceVertexId,
        req.sourcePortId,
        req.targetVertexId,
        req.targetPortId,
      ) === null) {
        SessionUtils.createEdge(
          this.session.data.graph,
          this.session.data.edgesByVertex,
          this.session.data.layers,
          req.newEdgeId,
          req.sourceVertexId,
          req.sourcePortId,
          req.targetVertexId,
          req.targetPortId,
        );
      }
    } else if (req.type === "cloneVertex") {
      if (SessionUtils.validateCloneVertex(
        this.session.data.graph,
        this.session.data.layers,
        this.session.data.edgesByVertex,
        req.newVertexId,
        req.sourceVertexId,
        req.x,
        req.y,
      ) === null) {
        SessionUtils.cloneVertex(
          this.session.data.graph,
          this.session.data.layers,
          this.session.data.edgesByVertex,
          req.newVertexId,
          req.sourceVertexId,
          req.x,
          req.y,
        );
      }
    } else if (req.type === "deleteVertex") {
      if (SessionUtils.validateDeleteVertex(
        this.session.data.graph,
        this.session.data.edgesByVertex,
        this.session.data.layers,
        req.vertexId,
      ) === null) {
        SessionUtils.deleteVertex(
          this.session.data.graph,
          this.session.data.edgesByVertex,
          this.session.data.layers,
          req.vertexId,
        );
      }
    } else if (req.type === "deleteEdge") {
      if (SessionUtils.validateDeleteEdge(
        this.session.data.graph,
        this.session.data.edgesByVertex,
        req.edgeId,
      ) === null) {
        SessionUtils.deleteEdge(
          this.session.data.graph,
          this.session.data.edgesByVertex,
          req.edgeId,
        );
      }
    } else if (req.type === "setLayerFields") {
      if (SessionUtils.validateSetLayerFields(
        this.session.data.graph,
        this.session.data.edgesByVertex,
        this.session.data.layers,
        req.layerId,
        req.fieldValues,
      ) === null) {
        SessionUtils.setLayerFields(
          this.session.data.graph,
          this.session.data.edgesByVertex,
          this.session.data.layers,
          req.layerId,
          req.fieldValues,
        );
      }
    } else {
      throw new Error(`Unimplemented request ${JSON.stringify(req)}`);
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
      const validationMessage = SessionUtils.validateCreateEdge(
        this.session.data.graph,
        this.session.data.edgesByVertex,
        this.session.data.layers,
        (req as ModelInfoRequestMap["validateEdge"]).edgeId,
        (req as ModelInfoRequestMap["validateEdge"]).sourceVertexId,
        (req as ModelInfoRequestMap["validateEdge"]).sourcePortId,
        (req as ModelInfoRequestMap["validateEdge"]).targetVertexId,
        (req as ModelInfoRequestMap["validateEdge"]).targetPortId,
      );
      const response: ModelInfoResponseMap["validateEdge"] = validationMessage === null ? {
        valid: true,
      } : {
        valid: false,
        problem: validationMessage
      };
      return response;
    } else if (req.type === "edgesBetweenVertices") {
      return GraphUtils.edgesBetweenVertices(
        this.session.data.graph,
        this.session.data.edgesByVertex,
        (req as ModelInfoRequestMap["edgesBetweenVertices"]).vertexIds,
      );
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
      return LayerUtils.getPortInfo(
        this.session.data.layers,
        (req as ModelInfoRequestMap["getPortInfo"]).portId,
        (req as ModelInfoRequestMap["getPortInfo"]).vertexId,
      );
    } else if (req.type === "validateValue") {
      return LayerUtils.validateValue(
        this.session.data.layers,
        (req as ModelInfoRequestMap["validateValue"]).layerId,
        (req as ModelInfoRequestMap["validateValue"]).valueId,
        (req as ModelInfoRequestMap["validateValue"]).newValue,
      );
    } else if (req.type === "getLayerInfo") {
      return LayerUtils.getLayerInfo(
        this.session.data.layers,
        (req as ModelInfoRequestMap["getLayerInfo"]).layerId,
      )
    } else if (req.type === "compareValue") {
      return LayerUtils.compareValue(
        this.session.data.layers,
        (req as ModelInfoRequestMap["compareValue"]).layerId,
        (req as ModelInfoRequestMap["compareValue"]).valueId,
        (req as ModelInfoRequestMap["compareValue"]).compareValue,
      );
    } else if (req.type === "validateLayerFields") {
      return LayerUtils.validateLayerFields(
        this.session.data.layers,
        (req as ModelInfoRequestMap["validateLayerFields"]).layerId,
        (req as ModelInfoRequestMap["validateLayerFields"]).fieldValues,
      );
    } else {
      throw new Error(`Unimplemented request ${req.type}`);
    }
  }
}
