import { GraphData, EdgeData, VertexData } from "../../interfaces.js";
import { GenericLayer } from "./layers/layers.js";

export interface EdgesByVertex {
  [key: string]: {
    in: string[];
    out: string[];
  };
}

export class GraphUtils {
  public static edgesBetweenVertices(
    graphData: GraphData,
    edgesByVertex: EdgesByVertex,
    vtxIds: string[],
  ) {
    const vtxOutputEdges = new Set<string>();
    const vtxInputEdges = new Set<string>();

    for (const vtxId of vtxIds) {
      for (const outEdgeId of edgesByVertex[vtxId].out) {
        vtxOutputEdges.add(outEdgeId);
      }
      for (const inEdgeId of edgesByVertex[vtxId].in) {
        vtxInputEdges.add(inEdgeId);
      }
    }

    const edgesBetween: {[key: string]: EdgeData} = {};

    for (const edgeId of vtxOutputEdges) {
      if (vtxInputEdges.has(edgeId)) {
        edgesBetween[edgeId] = graphData.edges[edgeId];
      }
    }

    return edgesBetween;
  }

  public static moveVertex(
    graphData: GraphData,
    edgesByVertex: EdgesByVertex,
    vtxId: string,
    x: number,
    y: number,
  ): void {
    const vtx = graphData.vertices[vtxId];
    if (vtx === undefined) throw new Error(`Could not find vertex with id ${vtxId}`);

    vtx.geo.x = x;
    vtx.geo.y = y;
  }

  public static deleteVertex(
    graphData: GraphData,
    edgesByVertex: EdgesByVertex,
    vertexId: string,
  ): void {
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
      this.deleteEdge(graphData, edgesByVertex, connectedEdge);
    }

    delete graphData.vertices[vertexId];
    delete edgesByVertex[vertexId];
  }

  public static deleteEdge(
    graphData: GraphData,
    edgesByVertex: EdgesByVertex,
    edgeId: string,
  ): void {
    if (graphData.edges[edgeId] === undefined) return;

    const edge = graphData.edges[edgeId];
    const inIdx = edgesByVertex[edge.sourceVertexId].out.indexOf(edgeId);
    edgesByVertex[edge.sourceVertexId].out.splice(inIdx, 1);
    const outIdx = edgesByVertex[edge.targetVertexId].in.indexOf(edgeId);
    edgesByVertex[edge.targetVertexId].in.splice(outIdx, 1);

    delete graphData.edges[edgeId];
  }

  public static cloneVertex(
    graphData: GraphData,
    edgesByVertex: EdgesByVertex,
    newVtxId: string,
    oldVtxId: string,
    x: number,
    y: number,
  ): void {
    if (graphData.vertices[newVtxId] !== undefined) throw new Error(`Vertex with id ${newVtxId} already exists`);
    const oldVtx = graphData.vertices[oldVtxId];
    if (oldVtx === undefined) throw new Error(`Coudl not find vertex with id ${oldVtxId}`);

    const newVtx: VertexData = JSON.parse(JSON.stringify(oldVtx));
    newVtx.geo.x = x;
    newVtx.geo.y = y;

    this.addVertex(graphData, edgesByVertex, newVtxId, newVtx);
  }

  public static createVertexFromLayer(layer: GenericLayer, x = 0, y = 0): VertexData {
    const vtxData: VertexData = {
      label: layer.getType(),
      geo: { x: x, y: y },
      ports: {},
    };
    let inputPortCount = layer.getPortIds().filter((id) => layer.getPortInfo(id).type === "input").length;
    let outputPortCount = layer.getPortIds().filter((id) => layer.getPortInfo(id).type === "output").length;

    let inputPortIdx = 0;
    let outputPortIdx = 0;
    for (const portId of layer.getPortIds()) {
      const portInfo = layer.getPortInfo(portId);
      vtxData.ports[portId] = {
        portType: portInfo.type,
        side: portInfo.type === "input" ? "top" : "bottom",
        position: portInfo.type === "input" ? (
          1/(inputPortCount + 1)*++inputPortIdx
        ) : (
          1/(outputPortCount + 1)*++outputPortIdx
        ),
      }
    }
    return vtxData;
  }

  public static addVertex(
    graphData: GraphData,
    edgesByVertex: EdgesByVertex,
    id: string,
    vtxData: VertexData,
  ): void {
    graphData.vertices[id] = vtxData;
    edgesByVertex[id] = {in: [], out: []};
  }

  public static createEdge(
    graphData: GraphData,
    edgesByVertex: EdgesByVertex,
    edgeId: string,
    sourceVtxId: string,
    sourcePortId: string,
    targetVtxId: string,
    targetPortId: string,
  ): void {
    const edgeIsValid = this.validateEdge(
      graphData,
      edgesByVertex,
      sourceVtxId,
      sourcePortId,
      targetVtxId,
      targetPortId,
    );

    if (!edgeIsValid) throw new Error(`Invalid create edge arguments: ${arguments}`);

    const edge = {
      sourceVertexId: sourceVtxId,
      sourcePortId: sourcePortId,
      targetVertexId: targetVtxId,
      targetPortId: targetPortId,
    };
    graphData.edges[edgeId] = edge;
    edgesByVertex[edge.sourceVertexId].out.push(edgeId);
    edgesByVertex[edge.targetVertexId].in.push(edgeId);
  }

  public static validateEdge(
    graphData: GraphData,
    edgesByVertex: EdgesByVertex,
    sourceVtxId: string,
    sourcePortId: string,
    targetVtxId: string,
    targetPortId: string,
  ): boolean {
    const sourceVertex = graphData.vertices[sourceVtxId];
    const targetVertex = graphData.vertices[targetVtxId];
    if (sourceVertex === undefined || targetVertex === undefined) return false;

    const sourcePort = sourceVertex.ports[sourcePortId];
    const targetPort = targetVertex.ports[targetPortId];

    if (sourcePort === undefined || targetPort === undefined) return false;

    if (sourcePort.portType !== "output") return false;
    if (targetPort.portType !== "input") return false;

    // check that there isn't an identical edge present
    const sourceOutEdges = edgesByVertex[sourceVtxId].out;
    const targetInEdges = edgesByVertex[targetVtxId].in;
    const edgesFromSourceToTarget = sourceOutEdges.filter((edgeId) => targetInEdges.indexOf(edgeId) !== -1);
    for (const edgeId of edgesFromSourceToTarget) {
      const edge = graphData.edges[edgeId];

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

      for (const edgeId of edgesByVertex[vtxIdToInvestigate].in) {
        const edgeData = graphData.edges[edgeId];
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
