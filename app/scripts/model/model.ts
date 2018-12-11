import {
  ModelInterface,
  GraphData,
  ModelChangeRequest,
  ModelInfoReqs,
  ModelVersioningRequest,
} from "../interfaces.js";
import {
  GraphUtils,
  EdgesByVertex,
} from "./graphUtils.js";
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
import { Queue } from "../queue.js";

export interface ModelDataObj {
  graph: GraphData;
  layers: LayerClassDict;
  edgesByVertex: EdgesByVertex;
}

export interface SessionData {
  data: ModelDataObj;
}

export class Model implements ModelInterface {
  private readonly graphChangedListeners: Array<() => void> = [];

  private readonly session: SessionData = {
    data: {
      graph: {
        vertices: {},
        edges: {},
      },
      layers: {},
      edgesByVertex: {},
    },
  };
  private readonly requestQueue: Queue;
  private readonly versioningManager: VersioningManager<SessionDataJson>;

  constructor() {
    this.requestQueue = new Queue();
    for (let i = 0; i < 3; i++) {
      const layer = Layer.getLayer("Repeat");
      LayerUtils.addLayer({
        layers: this.session.data.layers,
        newLayerId: i.toString(),
        layer: layer,
      });
      const vertex = GraphUtils.createVertexFromLayer({
        layer: layer,
        x: i*100,
        y: i*100,
      });
      GraphUtils.addVertex({
        graphData: this.session.data.graph,
        edgesByVertex: this.session.data.edgesByVertex,
        id: i.toString(),
        vtxData: vertex,
      });
    }
    this.versioningManager = new VersioningManager(SessionUtils.toJson(this.session.data));
  }

  public async getGraphData(): Promise<GraphData> {
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

      this.versioningManager.recordChange(newJson);
    }).then(() => {
      this.graphChangedListeners.forEach((l) => {
        l();
      });
    });
  }

  private async requestSingleModelChange(req: ModelChangeRequest): Promise<void> {
    if (req.type === "moveVertex") {
      if (
        GraphUtils.validateMoveVertex({
          graphData: this.session.data.graph,
          vtxId: req.vertexId,
          x: req.x,
          y: req.y,
        }) === null
      ) {
        GraphUtils.moveVertex({
          graphData: this.session.data.graph,
          vtxId: req.vertexId,
          x: req.x,
          y: req.y,
        });
      }
    } else if (req.type === "createEdge") {
      if (
        SessionUtils.validateCreateEdge({
          graphData: this.session.data.graph,
          edgesByVertex: this.session.data.edgesByVertex,
          layers: this.session.data.layers,
          edgeId: req.newEdgeId,
          sourceVtxId: req.sourceVertexId,
          sourcePortId: req.sourcePortId,
          targetVtxId: req.targetVertexId,
          targetPortId: req.targetPortId,
        }) === null
      ) {
        SessionUtils.createEdge({
          graphData: this.session.data.graph,
          edgesByVertex: this.session.data.edgesByVertex,
          layers: this.session.data.layers,
          edgeId: req.newEdgeId,
          sourceVtxId: req.sourceVertexId,
          sourcePortId: req.sourcePortId,
          targetVtxId: req.targetVertexId,
          targetPortId: req.targetPortId,
        });
      }
    } else if (req.type === "cloneVertex") {
      if (
        SessionUtils.validateCloneVertex({
          graphData: this.session.data.graph,
          layers: this.session.data.layers,
          edgesByVertex: this.session.data.edgesByVertex,
          newVtxId: req.newVertexId,
          oldVtxId: req.sourceVertexId,
          x: req.x,
          y: req.y,
        }) === null
      ) {
        SessionUtils.cloneVertex({
          graphData: this.session.data.graph,
          layers: this.session.data.layers,
          edgesByVertex: this.session.data.edgesByVertex,
          newVtxId: req.newVertexId,
          oldVtxId: req.sourceVertexId,
          x: req.x,
          y: req.y,
        });
      }
    } else if (req.type === "deleteVertex") {
      if (SessionUtils.validateDeleteVertex({
        graphData: this.session.data.graph,
        edgesByVertex: this.session.data.edgesByVertex,
        layers: this.session.data.layers,
        vertexId: req.vertexId,
      }) === null) {
        SessionUtils.deleteVertex({
          graphData: this.session.data.graph,
          edgesByVertex: this.session.data.edgesByVertex,
          layers: this.session.data.layers,
          vertexId: req.vertexId,
        });
      }
    } else if (req.type === "deleteEdge") {
      if (SessionUtils.validateDeleteEdge({
        graphData: this.session.data.graph,
        edgesByVertex: this.session.data.edgesByVertex,
        edgeId: req.edgeId,
      }) === null) {
        SessionUtils.deleteEdge({
          graphData: this.session.data.graph,
          edgesByVertex: this.session.data.edgesByVertex,
          edgeId: req.edgeId,
        });
      }
    } else if (req.type === "setLayerFields") {
      if (SessionUtils.validateSetLayerFields({
        graph: this.session.data.graph,
        edgesByVertex: this.session.data.edgesByVertex,
        layers: this.session.data.layers,
        layerId: req.layerId,
        fieldValues: req.fieldValues,
      }) === null) {
        SessionUtils.setLayerFields({
          graph: this.session.data.graph,
          edgesByVertex: this.session.data.edgesByVertex,
          layers: this.session.data.layers,
          layerId: req.layerId,
          fieldValues: req.fieldValues,
        });
      }
    } else {
      throw new Error("Unimplemented");
    }
  }

  public async requestModelVersioningChange(req: ModelVersioningRequest): Promise<void> {
    return this.requestQueue.addToQueue(async () => {
      if (req.type === "undo") {
        this.session.data = SessionUtils.fromJson(this.versioningManager.undo());
      } else if (req.type === "redo") {
        this.session.data = SessionUtils.fromJson(this.versioningManager.redo());
      } else if (req.type === "saveFile") {
        SaveUtils.saveFile(req.fileName, this.session);
        this.versioningManager.onFileSave(req.fileName);
      } else if (req.type === "openFile") {
        SaveUtils.openFile(req.fileName, this.session);
        this.versioningManager.onFileOpen(req.fileName, SessionUtils.toJson(this.session.data));
      } else if (req.type === "deleteFile") {
        SaveUtils.deleteFile(req.fileName, this.session);
        this.versioningManager.onFileDelete(req.fileName);
      } else {
        throw new Error("unimplemented");
      }
    }).then(() => {
      this.graphChangedListeners.forEach((l) => {
        l();
      });
    });
  }

  public async requestModelInfo<T extends keyof ModelInfoReqs>(
    req: ModelInfoReqs[T]["request"],
  ): Promise<ModelInfoReqs[T]["response"]> {
    return this.requestQueue.addToQueue(async () => {
      if (req.type === "validateEdge") {
        const validationMessage = SessionUtils.validateCreateEdge({
          graphData: this.session.data.graph,
          edgesByVertex: this.session.data.edgesByVertex,
          layers: this.session.data.layers,
          edgeId: (req as ModelInfoReqs["validateEdge"]["request"]).edgeId,
          sourceVtxId: (req as ModelInfoReqs["validateEdge"]["request"]).sourceVertexId,
          sourcePortId: (req as ModelInfoReqs["validateEdge"]["request"]).sourcePortId,
          targetVtxId: (req as ModelInfoReqs["validateEdge"]["request"]).targetVertexId,
          targetPortId: (req as ModelInfoReqs["validateEdge"]["request"]).targetPortId,
        });
        let response: ModelInfoReqs["validateEdge"]["response"];

        if (validationMessage === null) {
          response = {
            valid: true,
          };
        } else {
          response = {
            valid: false,
            problem: validationMessage,
          };
        }

        return response;
      } else if (req.type === "edgesBetweenVertices") {
        return GraphUtils.edgesBetweenVertices({
          graphData: this.session.data.graph,
          edgesByVertex: this.session.data.edgesByVertex,
          vtxIds: (req as ModelInfoReqs["edgesBetweenVertices"]["request"]).vertexIds,
        });
      } else if (req.type === "fileIsOpen") {
        let response: ModelInfoReqs["fileIsOpen"]["response"];

        const openFileName = this.versioningManager.getOpenFileName();

        if (openFileName === null) {
          response = {
            fileIsOpen: false,
          };
        } else {
          response = {
            fileIsOpen: true,
            fileName: openFileName,
            fileIsUpToDate: this.versioningManager.areAllChangesSaved(),
          };
        }

        return response;
      } else if (req.type === "savedFileNames") {
        const response: ModelInfoReqs["savedFileNames"]["response"] = {
          fileNames: SaveUtils.savedFileNames(),
        };
        return response;
      } else if (req.type === "getPortInfo") {
        return LayerUtils.getPortInfo({
          layers: this.session.data.layers,
          portId: (req as ModelInfoReqs["getPortInfo"]["request"]).portId,
          layerId: (req as ModelInfoReqs["getPortInfo"]["request"]).vertexId,
        });
      } else if (req.type === "validateValue") {
        return LayerUtils.validateValue({
          layers: this.session.data.layers,
          layerId: (req as ModelInfoReqs["validateValue"]["request"]).layerId,
          valueId: (req as ModelInfoReqs["validateValue"]["request"]).valueId,
          newValueString: (req as ModelInfoReqs["validateValue"]["request"]).newValue,
        });
      } else if (req.type === "getLayerInfo") {
        return LayerUtils.getLayerInfo({
          layers: this.session.data.layers,
          layerId: (req as ModelInfoReqs["getLayerInfo"]["request"]).layerId,
        });
      } else if (req.type === "compareValue") {
        return LayerUtils.compareValue({
          layers: this.session.data.layers,
          layerId: (req as ModelInfoReqs["compareValue"]["request"]).layerId,
          valueId: (req as ModelInfoReqs["compareValue"]["request"]).valueId,
          compareString: (req as ModelInfoReqs["compareValue"]["request"]).compareValue,
        });
      } else if (req.type === "validateLayerFields") {
        return LayerUtils.validateLayerFields({
          layers: this.session.data.layers,
          layerId: (req as ModelInfoReqs["validateLayerFields"]["request"]).layerId,
          fieldValues:(req as ModelInfoReqs["validateLayerFields"]["request"]).fieldValues,
        });
      } else if (req.type === "getUniqueEdgeIds") {
        return GraphUtils.getUniqueEdgeIds({
          graphData: this.session.data.graph,
          count: (req as ModelInfoReqs["getUniqueEdgeIds"]["request"]).count,
        });
      } else if (req.type === "getUniqueVertexIds") {
        return GraphUtils.getUniqueVertexIds({
          graphData: this.session.data.graph,
          count: (req as ModelInfoReqs["getUniqueVertexIds"]["request"]).count,
        });
      } else {
        throw new Error(`Unimplemented request ${req.type}`);
      }
    });
  }
}
