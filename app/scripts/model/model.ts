import {
  IGraphData,
  IModelInterface,
  ModelChangeRequest,
  ModelInfoReqs,
  ModelVersioningRequest,
} from "../interfaces.js";
import { Queue } from "../queue.js";
import {
  GraphUtils,
  IEdgesByVertex,
} from "./graphUtils.js";
import { Layer } from "./layers/layers.js";
import {
  ILayerClassDict,
  LayerUtils,
} from "./layerUtils.js";
import { SaveUtils } from "./saveUtils.js";
import {
  ISessionDataJson,
  SessionUtils,
} from "./sessionUtils.js";
import { VersioningManager } from "./versioningUtils.js";

export interface IModelDataObj {
  graph: IGraphData;
  layers: ILayerClassDict;
  edgesByVertex: IEdgesByVertex;
}

export interface ISessionData {
  data: IModelDataObj;
}

export class Model implements IModelInterface {
  private readonly graphChangedListeners: Array<() => void> = [];

  private readonly session: ISessionData = {
    data: {
      edgesByVertex: {},
      graph: {
        edges: {},
        vertices: {},
      },
      layers: {},
    },
  };
  private readonly requestQueue: Queue;
  private readonly versioningManager: VersioningManager<ISessionDataJson>;

  constructor() {
    this.requestQueue = new Queue();
    for (let i = 0; i < 5; i++) {
      const layer = Layer.getLayer(i % 2 === 0 ? "Repeat" : "AddLayer");
      LayerUtils.addLayer({
        layer: layer,
        layers: this.session.data.layers,
        newLayerId: i.toString(),
      });
      const vertex = GraphUtils.createVertexFromLayer({
        layer: layer,
        x: i * 100,
        y: i * 100,
      });
      GraphUtils.addVertex({
        edgesByVertex: this.session.data.edgesByVertex,
        graphData: this.session.data.graph,
        id: i.toString(),
        vtxData: vertex,
      });
    }
    this.versioningManager = new VersioningManager(SessionUtils.toJson(this.session.data));
  }

  public async getGraphData(): Promise<IGraphData> {
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

      SessionUtils.propagateEdges({
        edgesByVertex: this.session.data.edgesByVertex,
        graphData: this.session.data.graph,
        layers: this.session.data.layers,
      });

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
          edgeId: req.newEdgeId,
          edgesByVertex: this.session.data.edgesByVertex,
          graphData: this.session.data.graph,
          layers: this.session.data.layers,
          sourcePortId: req.sourcePortId,
          sourceVtxId: req.sourceVertexId,
          targetPortId: req.targetPortId,
          targetVtxId: req.targetVertexId,
        }) === null
      ) {
        SessionUtils.createEdge({
          edgeId: req.newEdgeId,
          edgesByVertex: this.session.data.edgesByVertex,
          graphData: this.session.data.graph,
          layers: this.session.data.layers,
          sourcePortId: req.sourcePortId,
          sourceVtxId: req.sourceVertexId,
          targetPortId: req.targetPortId,
          targetVtxId: req.targetVertexId,
        });
      }
    } else if (req.type === "cloneVertex") {
      if (
        SessionUtils.validateCloneVertex({
          edgesByVertex: this.session.data.edgesByVertex,
          graphData: this.session.data.graph,
          layers: this.session.data.layers,
          newVtxId: req.newVertexId,
          oldVtxId: req.sourceVertexId,
          x: req.x,
          y: req.y,
        }) === null
      ) {
        SessionUtils.cloneVertex({
          edgesByVertex: this.session.data.edgesByVertex,
          graphData: this.session.data.graph,
          layers: this.session.data.layers,
          newVtxId: req.newVertexId,
          oldVtxId: req.sourceVertexId,
          x: req.x,
          y: req.y,
        });
      }
    } else if (req.type === "deleteVertex") {
      if (SessionUtils.validateDeleteVertex({
        edgesByVertex: this.session.data.edgesByVertex,
        graphData: this.session.data.graph,
        layers: this.session.data.layers,
        vertexId: req.vertexId,
      }) === null) {
        SessionUtils.deleteVertex({
          edgesByVertex: this.session.data.edgesByVertex,
          graphData: this.session.data.graph,
          layers: this.session.data.layers,
          vertexId: req.vertexId,
        });
      }
    } else if (req.type === "deleteEdge") {
      if (SessionUtils.validateDeleteEdge({
        edgeId: req.edgeId,
        edgesByVertex: this.session.data.edgesByVertex,
        graphData: this.session.data.graph,
      }) === null) {
        SessionUtils.deleteEdge({
          edgeId: req.edgeId,
          edgesByVertex: this.session.data.edgesByVertex,
          graphData: this.session.data.graph,
        });
      }
    } else if (req.type === "setLayerFields") {
      if (SessionUtils.validateSetLayerFields({
        edgesByVertex: this.session.data.edgesByVertex,
        fieldValues: req.fieldValues,
        graph: this.session.data.graph,
        layerId: req.layerId,
        layers: this.session.data.layers,
      }) === null) {
        SessionUtils.setLayerFields({
          edgesByVertex: this.session.data.edgesByVertex,
          fieldValues: req.fieldValues,
          graph: this.session.data.graph,
          layerId: req.layerId,
          layers: this.session.data.layers,
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
          edgeId: (req as ModelInfoReqs["validateEdge"]["request"]).edgeId,
          edgesByVertex: this.session.data.edgesByVertex,
          graphData: this.session.data.graph,
          layers: this.session.data.layers,
          sourcePortId: (req as ModelInfoReqs["validateEdge"]["request"]).sourcePortId,
          sourceVtxId: (req as ModelInfoReqs["validateEdge"]["request"]).sourceVertexId,
          targetPortId: (req as ModelInfoReqs["validateEdge"]["request"]).targetPortId,
          targetVtxId: (req as ModelInfoReqs["validateEdge"]["request"]).targetVertexId,
        });
        let response: ModelInfoReqs["validateEdge"]["response"];

        if (validationMessage === null) {
          response = {
            valid: true,
          };
        } else {
          response = {
            problem: validationMessage,
            valid: false,
          };
        }

        return response;
      } else if (req.type === "edgesBetweenVertices") {
        return GraphUtils.edgesBetweenVertices({
          edgesByVertex: this.session.data.edgesByVertex,
          graphData: this.session.data.graph,
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
            fileIsUpToDate: this.versioningManager.areAllChangesSaved(),
            fileName: openFileName,
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
          layerId: (req as ModelInfoReqs["getPortInfo"]["request"]).vertexId,
          layers: this.session.data.layers,
          portId: (req as ModelInfoReqs["getPortInfo"]["request"]).portId,
        });
      } else if (req.type === "validateValue") {
        return LayerUtils.validateValue({
          layerId: (req as ModelInfoReqs["validateValue"]["request"]).layerId,
          layers: this.session.data.layers,
          newValueString: (req as ModelInfoReqs["validateValue"]["request"]).newValue,
          valueId: (req as ModelInfoReqs["validateValue"]["request"]).valueId,
        });
      } else if (req.type === "getLayerInfo") {
        return LayerUtils.getLayerInfo({
          layerId: (req as ModelInfoReqs["getLayerInfo"]["request"]).layerId,
          layers: this.session.data.layers,
        });
      } else if (req.type === "compareValue") {
        return LayerUtils.compareValue({
          compareString: (req as ModelInfoReqs["compareValue"]["request"]).compareValue,
          layerId: (req as ModelInfoReqs["compareValue"]["request"]).layerId,
          layers: this.session.data.layers,
          valueId: (req as ModelInfoReqs["compareValue"]["request"]).valueId,
        });
      } else if (req.type === "validateLayerFields") {
        return LayerUtils.validateLayerFields({
          fieldValues: (req as ModelInfoReqs["validateLayerFields"]["request"]).fieldValues,
          layerId: (req as ModelInfoReqs["validateLayerFields"]["request"]).layerId,
          layers: this.session.data.layers,
        });
      } else if (req.type === "getUniqueEdgeIds") {
        return GraphUtils.getUniqueEdgeIds({
          count: (req as ModelInfoReqs["getUniqueEdgeIds"]["request"]).count,
          graphData: this.session.data.graph,
        });
      } else if (req.type === "getUniqueVertexIds") {
        return GraphUtils.getUniqueVertexIds({
          count: (req as ModelInfoReqs["getUniqueVertexIds"]["request"]).count,
          graphData: this.session.data.graph,
        });
      } else if (req.type === "valueIsReadonly") {
        return SessionUtils.getValueIsReadonly({
          edgesByVertex: this.session.data.edgesByVertex,
          graphData: this.session.data.graph,
          layerId: (req as ModelInfoReqs["valueIsReadonly"]["request"]).layerId,
          layers: this.session.data.layers,
          valueId: (req as ModelInfoReqs["valueIsReadonly"]["request"]).valueId,
        });
      } else {
        throw new Error(`Unimplemented request ${req.type}`);
      }
    });
  }
}
