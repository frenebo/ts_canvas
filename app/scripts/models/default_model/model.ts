import {
  ModelInterface,
  GraphData,
  ModelChangeRequest,
  DeepReadonly,
  ModelInfoReqs,
  ModelVersioningRequest,
} from "../../interfaces.js";
import {
  GraphUtils,
  EdgesByVertex,
} from "./graphUtils.js";
import {
  Diffable,
  DiffType,
  createDiff,
} from "../../diff.js";
import { SaveUtils } from "./saveUtils.js";
import { VersioningManager } from "./versioningUtils.js";
import {
  LayerUtils,
  LayerClassDict,
} from "./layers/layerUtils.js";
import { Layer } from "./layers/layers.js";
import {
  SessionUtils,
  SessionDataJson,
} from "./sessionUtils.js";
import { Queue } from "../../queue.js";

export interface ModelDataObj {
  graph: GraphData;
  layers: LayerClassDict;
  edgesByVertex: EdgesByVertex;
}

export interface SessionData {
  data: ModelDataObj;
  openFile: null | {
    fileName: string;
    fileIdxInHistory: number | null;
  }
}

export class DefaultModel implements ModelInterface {
  private readonly graphChangedListeners: Array<() => void> = [];

  private session: SessionData = {
    data: {
      graph: {
        vertices: {},
        edges: {},
      },
      layers: {},
      edgesByVertex: {},
    },
    openFile: null,
  };
  private requestQueue: Queue;
  private versioningManager: VersioningManager<SessionDataJson>;
  constructor() {
    this.requestQueue = new Queue();
    this.versioningManager = new VersioningManager(SessionUtils.toJson(this.session.data));
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

  public async getGraphData(): Promise<DeepReadonly<GraphData>> {
    return this.session.data.graph;
  }

  public onDataChanged(listener: () => void): void {
    this.graphChangedListeners.push(listener);
  }

  public async requestModelChanges(...reqs: ModelChangeRequest[]): Promise<void> {
    return this.requestQueue.addToQueue(async () => {
      // const beforeChange = SessionUtils.toJson(this.session.data) as unknown as Diffable;

      for (const req of reqs) {
        await this.requestSingleModelChange(req);
      }

      const newJson = SessionUtils.toJson(this.session.data);

      this.versioningManager.recordChange(newJson)
    }).then(() => {
      this.graphChangedListeners.forEach(l => l())
    });
  }

  private async requestSingleModelChange(req: ModelChangeRequest): Promise<void> {
    if (req.type === "moveVertex") {
      if (
        await GraphUtils.validateMoveVertex(
          this.session.data.graph,
          req.vertexId,
          req.x,
          req.y,
        ) === null
    ) {
        await GraphUtils.moveVertex(
          this.session.data.graph,
          req.vertexId,
          req.x,
          req.y,
        );
      }
    } else if (req.type === "createEdge") {
      if (
        await SessionUtils.validateCreateEdge(
          this.session.data.graph,
          this.session.data.edgesByVertex,
          this.session.data.layers,
          req.newEdgeId,
          req.sourceVertexId,
          req.sourcePortId,
          req.targetVertexId,
          req.targetPortId,
        ) === null
      ) {
        await SessionUtils.createEdge(
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
      if (
        await SessionUtils.validateCloneVertex(
          this.session.data.graph,
          this.session.data.layers,
          this.session.data.edgesByVertex,
          req.newVertexId,
          req.sourceVertexId,
          req.x,
          req.y,
        ) === null
      ) {
        await SessionUtils.cloneVertex(
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
      throw new Error("Unimplemented");
    }
  }

  public async requestModelVersioningChange(req: ModelVersioningRequest): Promise<void> {
    return this.requestQueue.addToQueue(async () => {
      if (req.type === "undo") {
        // await VersioningUtils.undo(this.session);
      } else if (req.type === "redo") {
        // await VersioningUtils.redo(this.session);
      } else if (req.type === "saveFile") {
        await SaveUtils.saveFile(req.fileName, this.session);
      } else if (req.type === "openFile") {
        await SaveUtils.openFile(req.fileName, this.session);
      } else if (req.type === "deleteFile") {
        await SaveUtils.deleteFile(req.fileName, this.session);
      } else {
        throw new Error("unimplemented");
      }
    }).then(() => {
      this.graphChangedListeners.forEach(l => l());
    });
  }

  public async requestModelInfo<T extends keyof ModelInfoReqs>(
    req: ModelInfoReqs[T]["request"],
  ): Promise<ModelInfoReqs[T]["response"]> {
    return this.requestQueue.addToQueue(async () => {
      if (req.type === "validateEdge") {
        const validationMessage = SessionUtils.validateCreateEdge(
          this.session.data.graph,
          this.session.data.edgesByVertex,
          this.session.data.layers,
          (req as ModelInfoReqs["validateEdge"]["request"]).edgeId,
          (req as ModelInfoReqs["validateEdge"]["request"]).sourceVertexId,
          (req as ModelInfoReqs["validateEdge"]["request"]).sourcePortId,
          (req as ModelInfoReqs["validateEdge"]["request"]).targetVertexId,
          (req as ModelInfoReqs["validateEdge"]["request"]).targetPortId,
        );
        let response: ModelInfoReqs["validateEdge"]["response"]

        if (validationMessage === null) {
          response = {
            valid: true,
          }
        } else {
          response = {
            valid: false,
            problem: validationMessage
          };
        }

        return response;
      } else if (req.type === "edgesBetweenVertices") {
        return GraphUtils.edgesBetweenVertices(
          this.session.data.graph,
          this.session.data.edgesByVertex,
          (req as ModelInfoReqs["edgesBetweenVertices"]["request"]).vertexIds,
        );
      } else if (req.type === "fileIsOpen") {
        let response: ModelInfoReqs["fileIsOpen"]["response"];

        if (this.session.openFile === null) {
          response = {
            fileIsOpen: false,
          };
        } else {
          response = {
            fileIsOpen: true,
            fileName: this.session.openFile.fileName,
            fileIsUpToDate: this.session.openFile.fileIdxInHistory === 0,
          }
        }

        return response;
      } else if (req.type === "savedFileNames") {
        const response: ModelInfoReqs["savedFileNames"]["response"] = {
          fileNames: SaveUtils.savedFileNames(),
        };
        return response;
      } else if (req.type === "getPortInfo") {
        return LayerUtils.getPortInfo(
          this.session.data.layers,
          (req as ModelInfoReqs["getPortInfo"]["request"]).portId,
          (req as ModelInfoReqs["getPortInfo"]["request"]).vertexId,
        );
      } else if (req.type === "validateValue") {
        return LayerUtils.validateValue(
          this.session.data.layers,
          (req as ModelInfoReqs["validateValue"]["request"]).layerId,
          (req as ModelInfoReqs["validateValue"]["request"]).valueId,
          (req as ModelInfoReqs["validateValue"]["request"]).newValue,
        );
      } else if (req.type === "getLayerInfo") {
        return LayerUtils.getLayerInfo(
          this.session.data.layers,
          (req as ModelInfoReqs["getLayerInfo"]["request"]).layerId,
        )
      } else if (req.type === "compareValue") {
        return LayerUtils.compareValue(
          this.session.data.layers,
          (req as ModelInfoReqs["compareValue"]["request"]).layerId,
          (req as ModelInfoReqs["compareValue"]["request"]).valueId,
          (req as ModelInfoReqs["compareValue"]["request"]).compareValue,
        );
      } else if (req.type === "validateLayerFields") {
        return LayerUtils.validateLayerFields(
          this.session.data.layers,
          (req as ModelInfoReqs["validateLayerFields"]["request"]).layerId,
          (req as ModelInfoReqs["validateLayerFields"]["request"]).fieldValues,
        );
      } else if (req.type === "getUniqueEdgeIds") {
        return GraphUtils.getUniqueEdgeIds(
          this.session.data.graph,
          (req as ModelInfoReqs["getUniqueEdgeIds"]["request"]).count,
        );
      } else {
        throw new Error(`Unimplemented request ${req.type}`);
      }
    });
  }
}
