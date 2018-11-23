import { GraphData, EdgeData, VertexData } from "../../interfaces.js";

export class GraphUtils {
  public static edgesBetweenVertices(graphData: GraphData, vtxIds: string[]) {
    const edgeIds: {[key: string]: EdgeData} = {};
    for (const edgeId in graphData.edges) {
      const edge = graphData.edges[edgeId];
      if (
        vtxIds.indexOf(edge.sourceVertexId) !== -1 &&
        vtxIds.indexOf(edge.targetVertexId) !== -1
      ) {
        edgeIds[edgeId] = JSON.parse(JSON.stringify(edge));
      }
    }

    return edgeIds;
  }

  public static moveVertex(graphData: GraphData, vtxId: string, x: number, y: number): void {
    const vtx = graphData.vertices[vtxId];
    if (vtx === undefined) throw new Error(`Could not find vertex with id ${vtxId}`);

    vtx.geo.x = x;
    vtx.geo.y = y;
  }

  public static deleteVertex(graphData: GraphData, vertexId: string): void {
    if (graphData.vertices[vertexId] === undefined) return;

    const connectedEdges: string[] = [];
    for (const edgeId in graphData.edges) {
      if (
        graphData.edges[edgeId].sourceVertexId === vertexId ||
        graphData.edges[edgeId].targetVertexId === vertexId
      ) {
        connectedEdges.push(edgeId);
      }
    }
    for (const connectedEdge of connectedEdges) {
      this.deleteEdge(graphData, connectedEdge);
    }

    delete graphData.vertices[vertexId];
  }

  public static deleteEdge(graphData: GraphData, edgeId: string): void {
    if (graphData.edges[edgeId] === undefined) return;

    delete graphData.edges[edgeId];
  }

  public static cloneVertex(graphData: GraphData, newVtxId: string, oldVtxId: string, x: number, y: number): void {
    if (graphData.vertices[newVtxId] !== undefined) throw new Error(`Vertex with id ${newVtxId} already exists`);
    const oldVtx = graphData.vertices[oldVtxId];
    if (oldVtx === undefined) throw new Error(`Coudl not find vertex with id ${oldVtxId}`);

    const newVtx: VertexData = JSON.parse(JSON.stringify(oldVtx));
    newVtx.geo.x = x;
    newVtx.geo.y = y;

    this.createVertex(graphData, newVtxId, newVtx);
  }

  private static createVertex(graphData: GraphData, id: string, vtxData: VertexData): void {
    graphData.vertices[id] = vtxData;
  }

  public static createEdge(
    graphData: GraphData,
    edgeId: string,
    sourceVtxId: string,
    sourcePortId: string,
    targetVtxId: string,
    targetPortId: string,
  ): void {
    const edgeIsValid = this.validateEdge(graphData, sourceVtxId, sourcePortId, targetVtxId, targetPortId);
    if (!edgeIsValid) throw new Error(`Invalid create edge arguments: ${arguments}`);

    graphData.edges[edgeId] = {
      sourceVertexId: sourceVtxId,
      sourcePortId: sourcePortId,
      targetVertexId: targetVtxId,
      targetPortId: targetPortId,
    };
  }

  public static validateEdge(graphData: GraphData, sourceVtxId: string, sourcePortId: string, targetVtxId: string, targetPortId: string): boolean {
    const sourceVertex = graphData.vertices[sourceVtxId];
    const targetVertex = graphData.vertices[targetVtxId];
    if (sourceVertex === undefined || targetVertex === undefined) return false;

    const sourcePort = sourceVertex.ports[sourcePortId];
    const targetPort = targetVertex.ports[targetPortId];

    if (sourcePort === undefined || targetPort === undefined) return false;

    if (sourcePort.portType !== "output") return false;
    if (targetPort.portType !== "input") return false;

    // // Loop detection commented out
    return true;
    // const edgesByTarget: {
    //   [targetId: string]: EdgeData[];
    // } = {};
    //
    // for (const edgeId in graphData.edges) {
    //   const edgeData = graphData.edges[edgeId];
    //   if (edgesByTarget[edgeData.targetVertexId] === undefined) {
    //     edgesByTarget[edgeData.targetVertexId] = [];
    //   }
    //
    //   edgesByTarget[edgeData.targetVertexId].push(edgeData);
    // }
    //
    // const sourceAncestorIds: string[] = [];
    //
    // const vertexIdsToInvestigate: string[] = [sourceVtxId];
    // while (vertexIdsToInvestigate.length > 0) {
    //   const idToInvestigate = vertexIdsToInvestigate.pop() as string;
    //   sourceAncestorIds.push(idToInvestigate);
    //
    //   // if the investigated vertex is the target of no edges, skip it
    //   if (edgesByTarget[idToInvestigate] === undefined) {
    //     continue;
    //   } else {
    //     for (const edgeData of edgesByTarget[idToInvestigate]) {
    //       // check if the edge's source has not been seen before
    //       if (
    //         vertexIdsToInvestigate.indexOf(edgeData.sourceVertexId) === -1 &&
    //         sourceAncestorIds.indexOf(edgeData.sourceVertexId) === -1
    //       ) {
    //         vertexIdsToInvestigate.push(edgeData.sourceVertexId);
    //       }
    //     }
    //   }
    // }
    //
    // // return true if the target vertex is not an ancestor of the source vertex
    // if (sourceAncestorIds.indexOf(targetVtxId) === -1) {
    //   return true;
    // } else {
    //   return false;
    // }
  }
}
