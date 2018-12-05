import { ModelDataObj, SessionData } from "./model.js";
import { LayerUtils, LayerClassDictJson, LayerClassDict } from "./layers/layerUtils.js";
import { EdgesByVertex, GraphUtils } from "./graphUtils.js";
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

  public static validateEdge(
    graphData: GraphData,
    edgesByVertex: EdgesByVertex,
    sourceVtxId: string,
    sourcePortId: string,
    targetVtxId: string,
    targetPortId: string,
  ): string | null {
    const graphValidated = GraphUtils.validateEdge(
      graphData,
      edgesByVertex,
      sourceVtxId,
      sourcePortId,
      targetVtxId,
      targetPortId,
    );

    if (graphValidated !== null) return graphValidated;

    return null;
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
      const edge = graphData.edges[edgeId];
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
}
