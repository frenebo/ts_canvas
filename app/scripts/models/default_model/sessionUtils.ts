import { ModelDataObj } from "./model.js";
import {
  LayerUtils,
  LayerClassDictJson,
  LayerClassDict
} from "./layers/layerUtils.js";
import {
  EdgesByVertex,
  GraphUtils
} from "./graphUtils.js";
import { GraphData } from "../../interfaces.js";

export type SessionDataJson = {
  edgesByVertex: EdgesByVertex,
  graph: GraphData,
  layers: LayerClassDictJson,
}
export class SessionUtils {
  public static toJson(data: ModelDataObj): SessionDataJson {
    const jsonData = {
      edgesByVertex: JSON.parse(JSON.stringify(data.edgesByVertex)),
      graph: JSON.parse(JSON.stringify(data.graph)),
      layers: LayerUtils.toJson(data.layers)
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

  public static validateCreateEdge(
    graph: GraphData,
    edgesByVertex: EdgesByVertex,
    layers: LayerClassDict,
    edgeId: string,
    sourceVtxId: string,
    sourcePortId: string,
    targetVtxId: string,
    targetPortId: string,
  ): string | null {
    const graphValidated = GraphUtils.validateCreateEdge(
      graph,
      edgesByVertex,
      edgeId,
      sourceVtxId,
      sourcePortId,
      targetVtxId,
      targetPortId,
    );

    if (graphValidated !== null) return graphValidated;

    return null;
  }

  public static createEdge(
    graph: GraphData,
    edgesByVertex: EdgesByVertex,
    layers: LayerClassDict,
    edgeId: string,
    sourceVtxId: string,
    sourcePortId: string,
    targetVtxId: string,
    targetPortId: string,
  ): void {

    GraphUtils.createEdge(
      graph,
      edgesByVertex,
      edgeId,
      sourceVtxId,
      sourcePortId,
      targetVtxId,
      targetPortId,
    );
    SessionUtils.updateEdgeConsistency(
      graph,
      layers,
      edgeId,
    );
  }

  public static setLayerFields(
    graph: GraphData,
    edgesByVertex: EdgesByVertex,
    layers: LayerClassDict,
    layerId: string,
    fieldValues: {[key: string]: string},
  ): void {
    LayerUtils.setLayerFields(
      layers,
      layerId,
      fieldValues,
    );
    SessionUtils.updateEdgeConsistenciesFrom(
      graph,
      edgesByVertex,
      layers,
      layerId,
    );
  }

  public static updateEdgeConsistenciesFrom(
    graphData: GraphData,
    edgesByVertex: EdgesByVertex,
    layers: LayerClassDict,
    vertexId: string,
  ): void {
    const vertex = graphData.vertices[vertexId];
    if (vertex === undefined) throw new Error(`Could not find vertex ${vertexId}`);

    const sourceLayer = layers[vertexId];

    const edgeIdsOut: string[] = edgesByVertex[vertexId].out;

    for (const edgeId of edgeIdsOut) {
      SessionUtils.updateEdgeConsistency(graphData, layers, edgeId);
    }
  }

  public static validateCloneVertex(
    graphData: GraphData,
    layers: LayerClassDict,
    edgesByVertex: EdgesByVertex,
    newVtxId: string,
    oldVtxId: string,
    x: number,
    y: number,
  ): string | null {
    const graphValidate = GraphUtils.validateCloneVertex(
      graphData,
      edgesByVertex,
      newVtxId,
      oldVtxId,
      x,
      y,
    );
    return graphValidate;
  }

  public static validateDeleteVertex(
    graph: GraphData,
    edgesByVertex: EdgesByVertex,
    layers: LayerClassDict,
    vertexId: string,
  ): string | null {
    const graphValidation = GraphUtils.validateDeleteVertex(
      graph,
      edgesByVertex,
      vertexId,
    );

    return graphValidation;
  }

  public static deleteEdge(
    graph: GraphData,
    edgesByVertex: EdgesByVertex,
    edgeId: string,
  ): void {
    GraphUtils.deleteEdge(
      graph,
      edgesByVertex,
      edgeId,
    );
  }

  public static validateSetLayerFields(
    graph: GraphData,
    edgesByVertex: EdgesByVertex,
    layers: LayerClassDict,
    layerId: string,
    fieldValues: {[key: string]: string},
  ): string | null {
    const validated = LayerUtils.validateLayerFields(
      layers,
      layerId,
      fieldValues,
    );
    if (validated.requestError !== null) return validated.requestError;
    if (validated.errors.length === 0) return null;
    else return validated.errors.join(", ");
  }

  public static validateDeleteEdge(
    graph: GraphData,
    edgesByVertex: EdgesByVertex,
    edgeId: string,
  ): string | null {
    return GraphUtils.validateDeleteEdge(
      graph,
      edgesByVertex,
      edgeId,
    );
  }

  public static deleteVertex(
    graph: GraphData,
    edgesByVertex: EdgesByVertex,
    layers: LayerClassDict,
    vertexId: string,
  ): void {
    GraphUtils.deleteVertex(
      graph,
      edgesByVertex,
      vertexId,
    );
    LayerUtils.deleteLayer(
      layers,
      vertexId,
    );
  }

  public static cloneVertex(
    graph: GraphData,
    layers: LayerClassDict,
    edgesByVertex: EdgesByVertex,
    newVtxId: string,
    oldVtxId: string,
    x: number,
    y: number,
  ): void {

    GraphUtils.cloneVertex(
      graph,
      edgesByVertex,
      newVtxId,
      oldVtxId,
      x,
      y,
    );
    LayerUtils.cloneLayer(
      layers,
      oldVtxId,
      newVtxId,
    );
  }

  public static updateEdgeConsistency(
    graphData: GraphData,
    layers: LayerClassDict,
    edgeId: string,
  ): void {
    const edge = graphData.edges[edgeId];
    const sourceLayer = layers[edge.sourceVertexId];
    const targetLayer = layers[edge.targetVertexId];

    const sourcePortId = edge.sourcePortId;
    const targetPortId = edge.targetPortId;
    const sourceValueId = sourceLayer.getPortInfo(sourcePortId).valueKey;
    const targetValueId = targetLayer.getPortInfo(targetPortId).valueKey;
    const sourceValue = sourceLayer.getValueWrapper(sourceValueId);
    const targetValue = targetLayer.getValueWrapper(targetValueId);
    const isConsistent: boolean = sourceValue.compareTo(targetValue.getValue());

    edge.consistency = isConsistent ? "consistent" : "inconsistent";
  }
}
