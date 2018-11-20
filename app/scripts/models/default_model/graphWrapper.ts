import { ModelData, EdgeData } from "../../interfaces";

export class Graph {
  private modelData: ModelData;

  constructor() {
    this.modelData = {
      vertices: {},
      edges: {},
    };
    for (let i = 0; i < 100; i++) {
      this.modelData.vertices[i.toString()] = {
        label: i.toString(),
        geo: {
          x: i*5,
          y: i*5,
        },
        ports: {
          "input0": {
            side: "top",
            position: 0.5,
            portType: "input",
          },
          "outpot0": {
            side: "bottom",
            position: 0.5,
            portType: "output",
          }
        }
      }
    }
  }

  public getModelData(): ModelData {
    return JSON.parse(JSON.stringify(this.modelData));
  }

  public moveVertex(vtxId: string, x: number, y: number): void {
    const vtx = this.modelData.vertices[vtxId];
    if (vtx === undefined) throw new Error(`Could not find vertex with id ${vtxId}`);

    vtx.geo.x = x;
    vtx.geo.y = y;
  }

  public createEdge(edgeId: string, sourceVtxId: string, sourcePortId: string, targetVtxId: string, targetPortId: string): void {
    const edgeIsValid = this.validateEdge(sourceVtxId, sourcePortId, targetVtxId, targetPortId);
    if (!edgeIsValid) throw new Error(`Invalid create edge arguments: ${arguments}`);

    this.modelData.edges[edgeId] = {
      sourceVertexId: sourceVtxId,
      sourcePortId: sourcePortId,
      targetVertexId: targetVtxId,
      targetPortId: targetPortId,
    };
  }

  public validateEdge(sourceVtxId: string, sourcePortId: string, targetVtxId: string, targetPortId: string): boolean {
    const sourceVertex = this.modelData.vertices[sourceVtxId];
    const targetVertex = this.modelData.vertices[targetVtxId];
    if (sourceVertex === undefined || targetVertex === undefined) return false;

    const sourcePort = sourceVertex.ports[sourcePortId];
    const targetPort = targetVertex.ports[targetPortId];

    if (sourcePort === undefined || targetPort === undefined) return false;

    if (sourcePort.portType !== "output") return false;
    if (targetPort.portType !== "input") return false;

    // @TODO check for loops in graph

    let edgesByTarget: {
      [targetId: string]: EdgeData[];
    } = {};

    for (const edgeId in this.modelData.edges) {
      const edgeData = this.modelData.edges[edgeId];
      if (edgesByTarget[edgeData.targetVertexId] === undefined) {
        edgesByTarget[edgeData.targetVertexId] = [];
      }

      edgesByTarget[edgeData.targetVertexId].push(edgeData);
    }

    let sourceAncestorIds: string[] = [];

    let vertexIdsToInvestigate: string[] = [sourceVtxId];
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

    console.log(sourceAncestorIds, targetVtxId);

    // return true if the target vertex is not an ancestor of the source vertex
    if (sourceAncestorIds.indexOf(targetVtxId) === -1) {
      return true;
    } else {
      return false;
    }
  }
}
