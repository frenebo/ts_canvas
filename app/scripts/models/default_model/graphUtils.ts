import { ModelData, EdgeData, VertexData } from "../../interfaces.js";

export class GraphUtils {
  public static edgesBetweenVertices(modelData: ModelData, vtxIds: string[]) {
    const edgeIds: {[key: string]: EdgeData} = {};
    for (const edgeId in modelData.edges) {
      const edge = modelData.edges[edgeId];
      if (
        vtxIds.indexOf(edge.sourceVertexId) !== -1 &&
        vtxIds.indexOf(edge.targetVertexId) !== -1
      ) {
        edgeIds[edgeId] = JSON.parse(JSON.stringify(edge));
      }
    }

    return edgeIds;
  }

  public static moveVertex(modelData: ModelData, vtxId: string, x: number, y: number): void {
    const vtx = modelData.vertices[vtxId];
    if (vtx === undefined) throw new Error(`Could not find vertex with id ${vtxId}`);

    vtx.geo.x = x;
    vtx.geo.y = y;
  }

  public static deleteVertex(modelData: ModelData, vertexId: string): void {
    if (modelData.vertices[vertexId] === undefined) return;

    const connectedEdges: string[] = [];
    for (const edgeId in modelData.edges) {
      console.log(modelData.edges[edgeId]);
      if (modelData.edges[edgeId].sourceVertexId === vertexId || modelData.edges[edgeId].targetVertexId === vertexId) {
        connectedEdges.push(edgeId);
      }
    }
    for (const connectedEdge of connectedEdges) {
      this.deleteEdge(modelData, connectedEdge);
    }

    delete modelData.vertices[vertexId];
  }

  public static deleteEdge(modelData: ModelData, edgeId: string): void {
    if (modelData.edges[edgeId] === undefined) return;

    delete modelData.edges[edgeId];
  }

  public static cloneVertex(modelData: ModelData, newVtxId: string, oldVtxId: string, x: number, y: number): void {
    if (modelData.vertices[newVtxId] !== undefined) throw new Error(`Vertex with id ${newVtxId} already exists`);
    const oldVtx = modelData.vertices[oldVtxId];
    if (oldVtx === undefined) throw new Error(`Coudl not find vertex with id ${oldVtxId}`);

    const newVtx: VertexData = JSON.parse(JSON.stringify(oldVtx));
    newVtx.geo.x = x;
    newVtx.geo.y = y;

    this.createVertex(modelData, newVtxId, newVtx);
  }

  private static createVertex(modelData: ModelData, id: string, vtxData: VertexData): void {
    modelData.vertices[id] = vtxData;
  }

  public static createEdge(
    modelData: ModelData,
    edgeId: string,
    sourceVtxId: string,
    sourcePortId: string,
    targetVtxId: string,
    targetPortId: string,
  ): void {
    const edgeIsValid = this.validateEdge(modelData, sourceVtxId, sourcePortId, targetVtxId, targetPortId);
    if (!edgeIsValid) throw new Error(`Invalid create edge arguments: ${arguments}`);

    modelData.edges[edgeId] = {
      sourceVertexId: sourceVtxId,
      sourcePortId: sourcePortId,
      targetVertexId: targetVtxId,
      targetPortId: targetPortId,
    };
  }

  public static validateEdge(modelData: ModelData, sourceVtxId: string, sourcePortId: string, targetVtxId: string, targetPortId: string): boolean {
    const sourceVertex = modelData.vertices[sourceVtxId];
    const targetVertex = modelData.vertices[targetVtxId];
    if (sourceVertex === undefined || targetVertex === undefined) return false;

    const sourcePort = sourceVertex.ports[sourcePortId];
    const targetPort = targetVertex.ports[targetPortId];

    if (sourcePort === undefined || targetPort === undefined) return false;

    if (sourcePort.portType !== "output") return false;
    if (targetPort.portType !== "input") return false;

    // @TODO check for loops in graph

    const edgesByTarget: {
      [targetId: string]: EdgeData[];
    } = {};

    for (const edgeId in modelData.edges) {
      const edgeData = modelData.edges[edgeId];
      if (edgesByTarget[edgeData.targetVertexId] === undefined) {
        edgesByTarget[edgeData.targetVertexId] = [];
      }

      edgesByTarget[edgeData.targetVertexId].push(edgeData);
    }

    const sourceAncestorIds: string[] = [];

    const vertexIdsToInvestigate: string[] = [sourceVtxId];
    while (vertexIdsToInvestigate.length > 0) {
      const idToInvestigate = vertexIdsToInvestigate.pop() as string;
      sourceAncestorIds.push(idToInvestigate);

      // if the investigated vertex is the target of no edges, skip it
      if (edgesByTarget[idToInvestigate] === undefined) {
        continue;
      } else {
        for (const edgeData of edgesByTarget[idToInvestigate]) {
          // check if the edge's source has not been seen before
          if (
            vertexIdsToInvestigate.indexOf(edgeData.sourceVertexId) === -1 &&
            sourceAncestorIds.indexOf(edgeData.sourceVertexId) === -1
          ) {
            vertexIdsToInvestigate.push(edgeData.sourceVertexId);
          }
        }
      }
    }

    // return true if the target vertex is not an ancestor of the source vertex
    if (sourceAncestorIds.indexOf(targetVtxId) === -1) {
      return true;
    } else {
      return false;
    }
  }
}
