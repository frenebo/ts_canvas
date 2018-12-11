import { ModelDataObj } from "./model.js";
import {
  LayerUtils,
  LayerClassDictJson,
  LayerClassDict,
} from "./layers/layerUtils.js";
import {
  EdgesByVertex,
  GraphUtils,
} from "./graphUtils.js";
import { GraphData, ModelInfoReqs } from "../interfaces.js";
import { Layer } from "./layers/layers.js";

export interface SessionDataJson {
  edgesByVertex: EdgesByVertex;
  graph: GraphData;
  layers: LayerClassDictJson;
}

export class SessionUtils {
  public static toJson(data: ModelDataObj): SessionDataJson {
    const jsonData = {
      edgesByVertex: JSON.parse(JSON.stringify(data.edgesByVertex)),
      graph: JSON.parse(JSON.stringify(data.graph)),
      layers: LayerUtils.toJson(data.layers),
    };
    return jsonData;
  }

  public static fromJson(jsonData: SessionDataJson): ModelDataObj {
    const modelData: ModelDataObj = {
      edgesByVertex: JSON.parse(JSON.stringify(jsonData.edgesByVertex)),
      graph: JSON.parse(JSON.stringify(jsonData.graph)),
      layers: LayerUtils.fromJson(jsonData.layers),
    };
    return modelData;
  }

  public static validateCreateEdge(args: {
    graphData: GraphData;
    edgesByVertex: EdgesByVertex;
    layers: LayerClassDict;
    edgeId: string;
    sourceVtxId: string;
    sourcePortId: string;
    targetVtxId: string;
    targetPortId: string;
  }): string | null {
    const graphValidated = GraphUtils.validateCreateEdge({
      graphData: args.graphData,
      edgesByVertex: args.edgesByVertex,
      newEdgeId: args.edgeId,
      sourceVtxId: args.sourceVtxId,
      sourcePortId: args.sourcePortId,
      targetVtxId: args.targetVtxId,
      targetPortId: args.targetPortId,
    });

    if (graphValidated !== null) return graphValidated;

    const sourceLayer = args.layers[args.sourceVtxId];
    const targetLayer = args.layers[args.targetVtxId];

    const targetValueOccupied = SessionUtils.getValueIsReadonly({
      graphData: args.graphData,
      edgesByVertex: args.edgesByVertex,
      layers: args.layers,
      layerId: args.targetVtxId,
      valueId: targetLayer.getPortInfo(args.targetPortId).valueKey,
    });

    if (targetValueOccupied.requestError !== null) return "Target does not exist";

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
    if (targetValidatedValue !== null) return `Incompatible source and target: ${targetValidatedValue}`;

    return null;
  }

  public static createEdge(args: {
    graphData: GraphData;
    edgesByVertex: EdgesByVertex;
    layers: LayerClassDict;
    edgeId: string;
    sourceVtxId: string;
    sourcePortId: string;
    targetVtxId: string;
    targetPortId: string;
  }): void {

    GraphUtils.createEdge({
      graphData: args.graphData,
      edgesByVertex: args.edgesByVertex,
      newEdgeId: args.edgeId,
      sourceVtxId: args.sourceVtxId,
      sourcePortId: args.sourcePortId,
      targetVtxId: args.targetVtxId,
      targetPortId: args.targetPortId,
    });
    SessionUtils.propagateEdgesFrom({
      graphData: args.graphData,
      edgesByVertex: args.edgesByVertex,
      layers: args.layers,
      vertexId: args.sourceVtxId,
    });
  }

  public static setLayerFields(args: {
    graph: GraphData;
    edgesByVertex: EdgesByVertex;
    layers: LayerClassDict;
    layerId: string;
    fieldValues: {[key: string]: string};
  }): void {
    LayerUtils.setLayerFields({
      layers: args.layers,
      layerId: args.layerId,
      fieldValues: args.fieldValues,
    });
    SessionUtils.propagateEdgesFrom({
      graphData: args.graph,
      edgesByVertex: args.edgesByVertex,
      layers: args.layers,
      vertexId: args.layerId,
    });
  }

  private static vertexTopoSort(args: {
    graphData: GraphData;
    edgesByVertex: EdgesByVertex;
  }): string[] {
    const topToBottom: string[] = [];
    const remainingVertexIds = new Set(Object.keys(args.graphData.vertices));
    while (remainingVertexIds.size !== 0) {
      const roots = Object.keys(args.graphData.vertices).filter((key) => {
        for (const edgeId of args.edgesByVertex[key].in) {
          const edge = args.graphData.edges[edgeId];
          if (remainingVertexIds.has(edge.sourceVertexId)) return false;
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

  public static propagateEdgesFrom(args: {
    graphData: GraphData;
    edgesByVertex: EdgesByVertex;
    layers: LayerClassDict;
    vertexId: string;
  }): void {
    if (args.graphData.vertices[args.vertexId] === undefined) throw new Error(`Could not find vertex ${args.vertexId}`);

    const verticesToInvestigate = new Set<string>([args.vertexId]);
    const propagateVertices = new Set<string>();

    while (verticesToInvestigate.size !== 0) {
      const vertexId = verticesToInvestigate.keys().next().value;
      verticesToInvestigate.delete(vertexId);
      propagateVertices.add(vertexId);

      for (const edgeIdOut of args.edgesByVertex[vertexId].out) {
        const edgeTargetVtxId = args.graphData.edges[edgeIdOut].targetVertexId;
        if (
          (!verticesToInvestigate.has(edgeTargetVtxId)) &&
          (!propagateVertices.has(edgeTargetVtxId))
        ) {
          verticesToInvestigate.add(edgeTargetVtxId)
        }
      }
    }

    const sortedVertices = this.vertexTopoSort({
      graphData: args.graphData,
      edgesByVertex: args.edgesByVertex,
    });
    const vertexSortIdxById: {[key: string]: number} = {};
    for (let i = 0; i < sortedVertices.length; i++) {
      vertexSortIdxById[sortedVertices[i]] = i;
    }

    const sortedPropagateVertices = Array.from(propagateVertices).sort((v1, v2) => {
      return vertexSortIdxById[v1] - vertexSortIdxById[v2];
    });

    for (const propagateVtxId of sortedPropagateVertices) {
      for (const edgeOutId of args.edgesByVertex[propagateVtxId].out) {
        SessionUtils.propagateEdge({
          graphData: args.graphData,
          edgesByVertex: args.edgesByVertex,
          layers: args.layers,
          edgeId: edgeOutId,
        });
      }
    }
  }

  public static validateCloneVertex(args: {
    graphData: GraphData;
    layers: LayerClassDict;
    edgesByVertex: EdgesByVertex;
    newVtxId: string;
    oldVtxId: string;
    x: number;
    y: number;
  }): string | null {
    const graphValidate = GraphUtils.validateCloneVertex(args);
    return graphValidate;
  }

  public static validateDeleteVertex(args: {
    graphData: GraphData;
    edgesByVertex: EdgesByVertex;
    layers: LayerClassDict;
    vertexId: string;
  }): string | null {
    const graphValidation = GraphUtils.validateDeleteVertex(args);

    return graphValidation;
  }

  public static deleteEdge(args: {
    graphData: GraphData;
    edgesByVertex: EdgesByVertex;
    edgeId: string;
  }): void {
    GraphUtils.deleteEdge(args);
  }

  public static validateSetLayerFields(args: {
    graph: GraphData;
    edgesByVertex: EdgesByVertex;
    layers: LayerClassDict;
    layerId: string;
    fieldValues: {[key: string]: string};
  }): string | null {
    const validated = LayerUtils.validateLayerFields(args);
    if (validated.requestError !== null) return validated.requestError;
    if (validated.errors.length === 0) return null;
    else return validated.errors.join(", ");
  }

  public static validateDeleteEdge(args: {
    graphData: GraphData;
    edgesByVertex: EdgesByVertex;
    edgeId: string;
  }): string | null {
    return GraphUtils.validateDeleteEdge(args);
  }

  public static deleteVertex(args: {
    graphData: GraphData;
    edgesByVertex: EdgesByVertex;
    layers: LayerClassDict;
    vertexId: string;
  }): void {
    GraphUtils.deleteVertex({
      graphData: args.graphData,
      edgesByVertex: args.edgesByVertex,
      vertexId: args.vertexId,
    });
    LayerUtils.deleteLayer({
      layers: args.layers,
      layerId: args.vertexId,
    });
  }

  public static cloneVertex(args: {
    graphData: GraphData;
    layers: LayerClassDict;
    edgesByVertex: EdgesByVertex;
    newVtxId: string;
    oldVtxId: string;
    x: number;
    y: number;
  }): void {

    GraphUtils.cloneVertex({
      graphData: args.graphData,
      edgesByVertex: args.edgesByVertex,
      newVtxId: args.newVtxId,
      oldVtxId: args.oldVtxId,
      x: args.x,
      y: args.y,
    });
    LayerUtils.cloneLayer({
      layers: args.layers,
      layerId: args.oldVtxId,
      newLayerId: args.newVtxId,
    });
  }

  public static getValueIsReadonly(args: {
    graphData: GraphData;
    layers: LayerClassDict;
    edgesByVertex: EdgesByVertex;
    layerId: string;
    valueId: string;
  }): ModelInfoReqs["valueIsReadonly"]["response"] {
    const vertex = args.graphData.vertices[args.layerId];
    if (vertex === undefined) return {requestError: "layer_nonexistent"};

    const layer = args.layers[args.layerId];
    if (!layer.hasField(args.valueId)) return {requestError: "field_nonexistent"};

    if (layer.isReadonlyField(args.valueId)) {
      return {
        requestError: null,
        isReadonly: true,
        reason: "value_is_not_modifiable",
      };
    }

    const vertexOccupiedPortIds = args.edgesByVertex[args.layerId].in.map((edgeId) => args.graphData.edges[edgeId].targetPortId);

    const layerOccupiedValueIds = vertexOccupiedPortIds.map((portId) => layer.getPortInfo(portId).valueKey);

    if (layerOccupiedValueIds.indexOf(args.valueId) !== -1) {
      return {
        requestError: null,
        isReadonly: true,
        reason: "port_is_occupied",
      };
    } else {
      return {
        requestError: null,
        isReadonly: false,
      };
    }
  }

  public static propagateEdge(args: {
    graphData: GraphData;
    edgesByVertex: EdgesByVertex;
    layers: LayerClassDict;
    edgeId: string;
  }): void {
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
        const validatedUpdate = testClone.validateUpdate();
        if (validatedUpdate.errors.length !== 0) {
          edge.consistency = "inconsistent";
        } else {
          targetValue.setValue(sourceValue.getValue());
          targetLayer.update();
          edge.consistency = "consistent";
        }
      }
    } else {
      edge.consistency = "consistent";
    }
  }
}
