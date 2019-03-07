
import { Queue } from "./queue.js";
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
import { IServerUtils } from "./server_utils/server_utils.js";

export interface IModelDataObj {
  graph: IGraphData;
  layers: ILayerClassDict;
  edgesByVertex: IEdgesByVertex;
}

export interface ISessionData {
  data: IModelDataObj;
}

export class Model implements IModelInterface {
  private readonly graphChangedListeners: Array<(data: IGraphData) => void> = [];

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

  constructor(
    private readonly serverUtils: IServerUtils,
    private readonly createDiff: DiffCreator,
  ) {
    this.requestQueue = new Queue();
    const exampleLayers: Array<"Repeat" | "Conv2D" | "AddLayer"> = ["Repeat", "Conv2D", "AddLayer"];
    for (let i = 0; i < 8; i++) {
      const layerType = exampleLayers[i % exampleLayers.length];
      const layer = Layer.getLayer(layerType, this.serverUtils);
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

  public onDataChanged(listener: (data: IGraphData) => void): void {
    this.graphChangedListeners.push(listener);
  }

  public async requestModelChanges(...reqs: ModelChangeRequest[]): Promise<void> {
    return this.requestQueue.addToQueue(async () => {
      // const beforeChange = SessionUtils.toJson(this.session.data) as unknown as Diffable;

      for (const req of reqs) {
        await this.requestSingleModelChange(req);
      }

      await SessionUtils.propagateEdges({
        edgesByVertex: this.session.data.edgesByVertex,
        graphData: this.session.data.graph,
        layers: this.session.data.layers,
      });

      const newJson = SessionUtils.toJson(this.session.data);

      this.versioningManager.recordChange(newJson);

      return newJson;
    }).then((newJson) => {
      this.graphChangedListeners.forEach((l) => {
        l(newJson.graph);
      });
    });
  }

  public async requestModelVersioningChange(req: ModelVersioningRequest): Promise<void> {
    return this.requestQueue.addToQueue(async () => {
      if (req.type === "undo") {
        this.session.data = SessionUtils.fromJson(this.versioningManager.undo(), this.serverUtils);
      } else if (req.type === "redo") {
        this.session.data = SessionUtils.fromJson(this.versioningManager.redo(), this.serverUtils);
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
        l(SessionUtils.toJson(this.session.data).graph);
      });
    });
  }

  public async requestModelInfo<T extends keyof IModelInfoReqs>(
    req: IModelInfoReqs[T]["request"],
  ): Promise<IModelInfoReqs[T]["response"]> {
    return this.requestQueue.addToQueue(async () => {
      if (req.type === "validateEdge") {
        const validationMessage = SessionUtils.validateCreateEdge({
          edgeId: (req as IModelInfoReqs["validateEdge"]["request"]).edgeId,
          edgesByVertex: this.session.data.edgesByVertex,
          graphData: this.session.data.graph,
          layers: this.session.data.layers,
          sourcePortId: (req as IModelInfoReqs["validateEdge"]["request"]).sourcePortId,
          sourceVtxId: (req as IModelInfoReqs["validateEdge"]["request"]).sourceVertexId,
          targetPortId: (req as IModelInfoReqs["validateEdge"]["request"]).targetPortId,
          targetVtxId: (req as IModelInfoReqs["validateEdge"]["request"]).targetVertexId,
        });
        let response: IModelInfoReqs["validateEdge"]["response"];

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
          vtxIds: (req as IModelInfoReqs["edgesBetweenVertices"]["request"]).vertexIds,
        });
      } else if (req.type === "fileIsOpen") {
        let response: IModelInfoReqs["fileIsOpen"]["response"];

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
        const response: IModelInfoReqs["savedFileNames"]["response"] = {
          fileNames: SaveUtils.savedFileNames(),
        };
        return response;
      } else if (req.type === "getPortInfo") {
        return LayerUtils.getPortInfo({
          layerId: (req as IModelInfoReqs["getPortInfo"]["request"]).vertexId,
          layers: this.session.data.layers,
          portId: (req as IModelInfoReqs["getPortInfo"]["request"]).portId,
        });
      } else if (req.type === "validateValue") {
        return LayerUtils.validateValue({
          layerId: (req as IModelInfoReqs["validateValue"]["request"]).layerId,
          layers: this.session.data.layers,
          newValueString: (req as IModelInfoReqs["validateValue"]["request"]).newValue,
          valueId: (req as IModelInfoReqs["validateValue"]["request"]).valueId,
        });
      } else if (req.type === "getLayerInfo") {
        return LayerUtils.getLayerInfo({
          layerId: (req as IModelInfoReqs["getLayerInfo"]["request"]).layerId,
          layers: this.session.data.layers,
        });
      } else if (req.type === "compareValue") {
        return LayerUtils.compareValue({
          compareString: (req as IModelInfoReqs["compareValue"]["request"]).compareValue,
          layerId: (req as IModelInfoReqs["compareValue"]["request"]).layerId,
          layers: this.session.data.layers,
          valueId: (req as IModelInfoReqs["compareValue"]["request"]).valueId,
        });
      } else if (req.type === "validateLayerFields") {
        return LayerUtils.validateLayerFields({
          fieldValues: (req as IModelInfoReqs["validateLayerFields"]["request"]).fieldValues,
          layerId: (req as IModelInfoReqs["validateLayerFields"]["request"]).layerId,
          layers: this.session.data.layers,
        });
      } else if (req.type === "getUniqueEdgeIds") {
        return GraphUtils.getUniqueEdgeIds({
          count: (req as IModelInfoReqs["getUniqueEdgeIds"]["request"]).count,
          graphData: this.session.data.graph,
        });
      } else if (req.type === "getUniqueVertexIds") {
        return GraphUtils.getUniqueVertexIds({
          count: (req as IModelInfoReqs["getUniqueVertexIds"]["request"]).count,
          graphData: this.session.data.graph,
        });
      } else if (req.type === "valueIsReadonly") {
        return SessionUtils.getValueIsReadonly({
          edgesByVertex: this.session.data.edgesByVertex,
          graphData: this.session.data.graph,
          layerId: (req as IModelInfoReqs["valueIsReadonly"]["request"]).layerId,
          layers: this.session.data.layers,
          valueId: (req as IModelInfoReqs["valueIsReadonly"]["request"]).valueId,
        });
      } else if (req.type === "getGraphData") {
        return {
          data: this.session.data.graph,
        };
      } else if (req.type == "getListOfLayers") {
        const response: IModelInfoReqs["getListOfLayers"]["response"] = {
          layers: [
            {
              layerName: "List of layers feature unimplemented on server side",
              reasonNotAvailable: "Unimplemented",
            },
          ],
        };
        return response;
      } else {
        throw new Error("unimplemented");
      }
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
      if (
        (await SessionUtils.validateSetLayerFields({
          edgesByVertex: this.session.data.edgesByVertex,
          fieldValues: req.fieldValues,
          graph: this.session.data.graph,
          layerId: req.layerId,
          layers: this.session.data.layers,
        })) === null
      ) {
        await SessionUtils.setLayerFields({
          edgesByVertex: this.session.data.edgesByVertex,
          fieldValues: req.fieldValues,
          graph: this.session.data.graph,
          layerId: req.layerId,
          layers: this.session.data.layers,
        });
      }
    }
  }
}
