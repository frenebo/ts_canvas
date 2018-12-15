
/// <reference path="../../../interfaces/interfaces.d.ts"/>
import {
  GraphUtils,
  IEdgesByVertex,
} from "./graphUtils.js";
import { Layer } from "./layers/layers.js";
import {
  ILayerClassDict,
  ILayerClassDictJson,
  LayerUtils,
} from "./layerUtils.js";
import { IModelDataObj } from "./model.js";
import { IServerUtils } from "./server_utils/server_utils.js";

export interface ISessionDataJson {
  edgesByVertex: IEdgesByVertex;
  graph: IGraphData;
  layers: ILayerClassDictJson;
}

export class SessionUtils {
  public static toJson(data: IModelDataObj): ISessionDataJson {
    const jsonData = {
      edgesByVertex: JSON.parse(JSON.stringify(data.edgesByVertex)),
      graph: JSON.parse(JSON.stringify(data.graph)),
      layers: LayerUtils.toJson(data.layers),
    };
    return jsonData;
  }

  public static fromJson(jsonData: ISessionDataJson, serverUtils: IServerUtils): IModelDataObj {
    const modelData: IModelDataObj = {
      edgesByVertex: JSON.parse(JSON.stringify(jsonData.edgesByVertex)),
      graph: JSON.parse(JSON.stringify(jsonData.graph)),
      layers: LayerUtils.fromJson(jsonData.layers, serverUtils),
    };
    return modelData;
  }

  public static validateCreateEdge(args: {
    graphData: IGraphData;
    edgesByVertex: IEdgesByVertex;
    layers: ILayerClassDict;
    edgeId: string;
    sourceVtxId: string;
    sourcePortId: string;
    targetVtxId: string;
    targetPortId: string;
  }): string | null {
    const graphValidated = GraphUtils.validateCreateEdge({
      edgesByVertex: args.edgesByVertex,
      graphData: args.graphData,
      newEdgeId: args.edgeId,
      sourcePortId: args.sourcePortId,
      sourceVtxId: args.sourceVtxId,
      targetPortId: args.targetPortId,
      targetVtxId: args.targetVtxId,
    });

    if (graphValidated !== null) {
      return graphValidated;
    }

    const sourceLayer = args.layers[args.sourceVtxId];
    const targetLayer = args.layers[args.targetVtxId];

    const targetValueOccupied = SessionUtils.getValueIsReadonly({
    edgesByVertex: args.edgesByVertex,
      graphData: args.graphData,
      layerId: args.targetVtxId,
      layers: args.layers,
      valueId: targetLayer.getPortInfo(args.targetPortId).valueKey,
    });

    if (targetValueOccupied.requestError !== null) {
      return "Target does not exist";
    }

    if (targetValueOccupied.isReadonly) {
      if (targetValueOccupied.reason === "port_is_occupied") {
        return "Target port is occupied";
      } else {
        return "Target port is readonly";
      }
    }

    const sourceValue = sourceLayer.getValueWrapper(sourceLayer.getPortInfo(args.sourcePortId).valueKey);
    const targetValue = targetLayer.getValueWrapper(targetLayer.getPortInfo(args.targetPortId).valueKey);

    const targetValidatedValue = targetValue.validateValue(sourceValue.getValue());
    if (targetValidatedValue !== null) {
      return `Incompatible source and target: ${targetValidatedValue}`;
    }

    return null;
  }

  public static createEdge(args: {
    graphData: IGraphData;
    edgesByVertex: IEdgesByVertex;
    layers: ILayerClassDict;
    edgeId: string;
    sourceVtxId: string;
    sourcePortId: string;
    targetVtxId: string;
    targetPortId: string;
  }): void {

    GraphUtils.createEdge({
      edgesByVertex: args.edgesByVertex,
      graphData: args.graphData,
      newEdgeId: args.edgeId,
      sourcePortId: args.sourcePortId,
      sourceVtxId: args.sourceVtxId,
      targetPortId: args.targetPortId,
      targetVtxId: args.targetVtxId,
    });
  }

  public static async setLayerFields(args: {
    graph: IGraphData;
    edgesByVertex: IEdgesByVertex;
    layers: ILayerClassDict;
    layerId: string;
    fieldValues: {[key: string]: string};
  }): Promise<void> {
    await LayerUtils.setLayerFields({
      fieldValues: args.fieldValues,
      layerId: args.layerId,
      layers: args.layers,
    });
  }

  public static async propagateEdges(args: {
    graphData: IGraphData;
    edgesByVertex: IEdgesByVertex;
    layers: ILayerClassDict;
  }): Promise<void> {
    const sortedVertices = this.vertexTopoSort({
      edgesByVertex: args.edgesByVertex,
      graphData: args.graphData,
    });

    for (const propagateVtxId of sortedVertices) {
      for (const edgeOutId of args.edgesByVertex[propagateVtxId].out) {
        await SessionUtils.propagateEdge({
          edgeId: edgeOutId,
          edgesByVertex: args.edgesByVertex,
          graphData: args.graphData,
          layers: args.layers,
        });
      }
    }
  }

  public static validateCloneVertex(args: {
    graphData: IGraphData;
    layers: ILayerClassDict;
    edgesByVertex: IEdgesByVertex;
    newVtxId: string;
    oldVtxId: string;
    x: number;
    y: number;
  }): string | null {
    const graphValidate = GraphUtils.validateCloneVertex(args);
    return graphValidate;
  }

  public static validateDeleteVertex(args: {
    graphData: IGraphData;
    edgesByVertex: IEdgesByVertex;
    layers: ILayerClassDict;
    vertexId: string;
  }): string | null {
    const graphValidation = GraphUtils.validateDeleteVertex(args);

    return graphValidation;
  }

  public static deleteEdge(args: {
    graphData: IGraphData;
    edgesByVertex: IEdgesByVertex;
    edgeId: string;
  }): void {
    GraphUtils.deleteEdge(args);
  }

  public static async validateSetLayerFields(args: {
    graph: IGraphData;
    edgesByVertex: IEdgesByVertex;
    layers: ILayerClassDict;
    layerId: string;
    fieldValues: {[key: string]: string};
  }): Promise<string | null> {
    const validated = await LayerUtils.validateLayerFields(args);
    if (validated.requestError !== null) {
      return validated.requestError;
    }
    if (validated.errors.length === 0) {
      return null;
    } else {
      return validated.errors.join(", ");
    }
  }

  public static validateDeleteEdge(args: {
    graphData: IGraphData;
    edgesByVertex: IEdgesByVertex;
    edgeId: string;
  }): string | null {
    return GraphUtils.validateDeleteEdge(args);
  }

  public static deleteVertex(args: {
    graphData: IGraphData;
    edgesByVertex: IEdgesByVertex;
    layers: ILayerClassDict;
    vertexId: string;
  }): void {
    GraphUtils.deleteVertex({
      edgesByVertex: args.edgesByVertex,
      graphData: args.graphData,
      vertexId: args.vertexId,
    });
    LayerUtils.deleteLayer({
      layerId: args.vertexId,
      layers: args.layers,
    });
  }

  public static cloneVertex(args: {
    graphData: IGraphData;
    layers: ILayerClassDict;
    edgesByVertex: IEdgesByVertex;
    newVtxId: string;
    oldVtxId: string;
    x: number;
    y: number;
  }): void {

    GraphUtils.cloneVertex({
      edgesByVertex: args.edgesByVertex,
      graphData: args.graphData,
      newVtxId: args.newVtxId,
      oldVtxId: args.oldVtxId,
      x: args.x,
      y: args.y,
    });
    LayerUtils.cloneLayer({
      layerId: args.oldVtxId,
      layers: args.layers,
      newLayerId: args.newVtxId,
    });
  }

  public static getValueIsReadonly(args: {
    graphData: IGraphData;
    layers: ILayerClassDict;
    edgesByVertex: IEdgesByVertex;
    layerId: string;
    valueId: string;
  }): IModelInfoReqs["valueIsReadonly"]["response"] {
    const vertex = args.graphData.vertices[args.layerId];
    if (vertex === undefined) {
      return {requestError: "layer_nonexistent"};
    }

    const layer = args.layers[args.layerId];
    if (!layer.hasField(args.valueId)) {
      return {requestError: "field_nonexistent"};
    }

    if (layer.isReadonlyField(args.valueId)) {
      return {
        isReadonly: true,
        reason: "value_is_not_modifiable",
        requestError: null,
      };
    }

    const vertexOccupiedPortIds = args.edgesByVertex[args.layerId].in.map((edgeId) => {
      return args.graphData.edges[edgeId].targetPortId;
    });

    const layerOccupiedValueIds = vertexOccupiedPortIds.map((portId) => layer.getPortInfo(portId).valueKey);

    if (layerOccupiedValueIds.indexOf(args.valueId) !== -1) {
      return {
        isReadonly: true,
        reason: "port_is_occupied",
        requestError: null,
      };
    } else {
      return {
        isReadonly: false,
        requestError: null,
      };
    }
  }

  public static async propagateEdge(args: {
    graphData: IGraphData;
    edgesByVertex: IEdgesByVertex;
    layers: ILayerClassDict;
    edgeId: string;
  }): Promise<void> {
    const edge = args.graphData.edges[args.edgeId];
    const sourceLayer = args.layers[edge.sourceVertexId];
    const targetLayer = args.layers[edge.targetVertexId];

    const sourcePortId = edge.sourcePortId;
    const targetPortId = edge.targetPortId;
    const sourceValueId = sourceLayer.getPortInfo(sourcePortId).valueKey;
    const targetValueId = targetLayer.getPortInfo(targetPortId).valueKey;
    const sourceValue = sourceLayer.getValueWrapper(sourceValueId);
    const targetValue = targetLayer.getValueWrapper(targetValueId);
    const isConsistent: boolean = sourceValue.compareTo(targetValue.getValue());

    if (!isConsistent) {
      const validateSetValue = targetValue.validateValue(sourceValue.getValue());

      if (validateSetValue !== null) {
        edge.consistency = "inconsistent";
      } else {
        const testClone = Layer.clone(targetLayer);
        testClone.getValueWrapper(targetValueId).setValue(sourceValue.getValue());
        const validatedUpdate = await testClone.validateUpdate();
        if (validatedUpdate.errors.length !== 0) {
          edge.consistency = "inconsistent";
        } else {
          targetValue.setValue(sourceValue.getValue());
          await targetLayer.update();
          edge.consistency = "consistent";
        }
      }
    } else {
      edge.consistency = "consistent";
    }
  }

  private static vertexTopoSort(args: {
    graphData: IGraphData;
    edgesByVertex: IEdgesByVertex;
  }): string[] {
    const topToBottom: string[] = [];
    const remainingVertexIds = new Set(Object.keys(args.graphData.vertices));
    while (remainingVertexIds.size !== 0) {
      const roots = Object.keys(args.graphData.vertices).filter((key) => {
        for (const edgeId of args.edgesByVertex[key].in) {
          const edge = args.graphData.edges[edgeId];
          if (remainingVertexIds.has(edge.sourceVertexId)) {
            return false;
          }
        }
        return true;
      });
      for (const root of roots) {
        topToBottom.push(root);
        remainingVertexIds.delete(root);
      }
    }

    return topToBottom;
  }
}
