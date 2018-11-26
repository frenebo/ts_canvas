import { GraphData, EdgeData, VertexData } from "../../interfaces.js";

export interface AugmentedGraphData {
  g: GraphData;
  edgesByVertex: {
    [key: string]: {
      in: string[];
      out: string[];
    };
  };
}

export class GraphUtils {
  public static edgesBetweenVertices(graphData: AugmentedGraphData, vtxIds: string[]) {
    const edgeIds: {[key: string]: EdgeData} = {};
    for (const edgeId in graphData.g.edges) {
      const edge = graphData.g.edges[edgeId];
      if (
        vtxIds.indexOf(edge.sourceVertexId) !== -1 &&
        vtxIds.indexOf(edge.targetVertexId) !== -1
      ) {
        edgeIds[edgeId] = JSON.parse(JSON.stringify(edge));
      }
    }

    return edgeIds;
  }

  public static moveVertex(graphData: AugmentedGraphData, vtxId: string, x: number, y: number): void {
    const vtx = graphData.g.vertices[vtxId];
    if (vtx === undefined) throw new Error(`Could not find vertex with id ${vtxId}`);

    vtx.geo.x = x;
    vtx.geo.y = y;
  }

  public static deleteVertex(graphData: AugmentedGraphData, vertexId: string): void {
    if (graphData.g.vertices[vertexId] === undefined) return;

    const connectedEdges: string[] = [];
    for (const edgeId in graphData.g.edges) {
      if (
        graphData.g.edges[edgeId].sourceVertexId === vertexId ||
        graphData.g.edges[edgeId].targetVertexId === vertexId
      ) {
        connectedEdges.push(edgeId);
      }
    }
    for (const connectedEdge of connectedEdges) {
      this.deleteEdge(graphData, connectedEdge);
    }

    delete graphData.g.vertices[vertexId];
    delete graphData.edgesByVertex[vertexId];
  }

  public static deleteEdge(graphData: AugmentedGraphData, edgeId: string): void {
    if (graphData.g.edges[edgeId] === undefined) return;

    const edge = graphData.g.edges[edgeId];
    const inIdx = graphData.edgesByVertex[edge.sourceVertexId].out.indexOf(edgeId);
    graphData.edgesByVertex[edge.sourceVertexId].out.splice(inIdx, 1);
    const outIdx = graphData.edgesByVertex[edge.targetVertexId].in.indexOf(edgeId);
    graphData.edgesByVertex[edge.targetVertexId].in.splice(outIdx, 1);

    delete graphData.g.edges[edgeId];
  }

  public static cloneVertex(
    graphData: AugmentedGraphData,
    newVtxId: string,
    oldVtxId: string,
    x: number,
    y: number,
  ): void {
    if (graphData.g.vertices[newVtxId] !== undefined) throw new Error(`Vertex with id ${newVtxId} already exists`);
    const oldVtx = graphData.g.vertices[oldVtxId];
    if (oldVtx === undefined) throw new Error(`Coudl not find vertex with id ${oldVtxId}`);

    const newVtx: VertexData = JSON.parse(JSON.stringify(oldVtx));
    newVtx.geo.x = x;
    newVtx.geo.y = y;

    this.createVertex(graphData, newVtxId, newVtx);
  }

  public static createVertex(graphData: AugmentedGraphData, id: string, vtxData: VertexData): void {
    graphData.g.vertices[id] = vtxData;
    graphData.edgesByVertex[id] = {in: [], out: []};
  }

  public static createEdge(
    graphData: AugmentedGraphData,
    edgeId: string,
    sourceVtxId: string,
    sourcePortId: string,
    targetVtxId: string,
    targetPortId: string,
  ): void {
    const edgeIsValid = this.validateEdge(graphData, sourceVtxId, sourcePortId, targetVtxId, targetPortId);
    if (!edgeIsValid) throw new Error(`Invalid create edge arguments: ${arguments}`);

    const edge = {
      sourceVertexId: sourceVtxId,
      sourcePortId: sourcePortId,
      targetVertexId: targetVtxId,
      targetPortId: targetPortId,
    };
    graphData.g.edges[edgeId] = edge;
    graphData.edgesByVertex[edge.sourceVertexId].out.push(edgeId);
    graphData.edgesByVertex[edge.targetVertexId].in.push(edgeId);
  }

  public static validateEdge(
    graphData: AugmentedGraphData,
    sourceVtxId: string,
    sourcePortId: string,
    targetVtxId: string,
    targetPortId: string,
  ): boolean {
    const sourceVertex = graphData.g.vertices[sourceVtxId];
    const targetVertex = graphData.g.vertices[targetVtxId];
    if (sourceVertex === undefined || targetVertex === undefined) return false;

    const sourcePort = sourceVertex.ports[sourcePortId];
    const targetPort = targetVertex.ports[targetPortId];

    if (sourcePort === undefined || targetPort === undefined) return false;

    if (sourcePort.portType !== "output") return false;
    if (targetPort.portType !== "input") return false;

    // check that there isn't an identical edge present
    const sourceOutEdges = graphData.edgesByVertex[sourceVtxId].out;
    const targetInEdges = graphData.edgesByVertex[targetVtxId].in;
    const edgesFromSourceToTarget = sourceOutEdges.filter((edgeId) => targetInEdges.indexOf(edgeId) !== -1);
    for (const edgeId of edgesFromSourceToTarget) {
      const edge = graphData.g.edges[edgeId];

      // check if the edge is identical
      if (edge.sourcePortId === sourcePortId && edge.targetPortId === targetPortId) {
        return false;
      }
    }

    // Loop detection
    const sourceAncestorIds: string[] = [];

    const vertexIdsToInvestigate: string[] = [sourceVtxId];
    while (vertexIdsToInvestigate.length > 0) {
      const vtxIdToInvestigate = vertexIdsToInvestigate.pop() as string;
      sourceAncestorIds.push(vtxIdToInvestigate);

      for (const edgeId of graphData.edgesByVertex[vtxIdToInvestigate].in) {
        const edgeData = graphData.g.edges[edgeId];
        // check if the edge's source has not been seen before
        if (
          vertexIdsToInvestigate.indexOf(edgeData.sourceVertexId) === -1 &&
          sourceAncestorIds.indexOf(edgeData.sourceVertexId) === -1
        ) {
          vertexIdsToInvestigate.push(edgeData.sourceVertexId);
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
