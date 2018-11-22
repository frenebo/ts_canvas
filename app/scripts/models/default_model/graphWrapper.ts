import { ModelData, EdgeData, VertexData } from "../../interfaces";

export class Graph {
  private modelData: ModelData;
  private edgesByVertex: {[key: string]: Set<string>} = {};

  constructor() {
    this.modelData = {
      vertices: {},
      edges: {},
    };
    for (let i = 0; i < 10; i++) {
      this.createVertex(i.toString(), {
        label: i.toString(),
        geo: {
          x: i*20,
          y: i*20,
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
      });
    }
  }

  public getModelData(): ModelData {
    return JSON.parse(JSON.stringify(this.modelData));
  }

  public edgesBetweenVertices(vtxIds: string[]) {
    const edgeIds: {[key: string]: EdgeData} = {};
    for (const edgeId in this.modelData.edges) {
      const edge = this.modelData.edges[edgeId];
      if (
        vtxIds.indexOf(edge.sourceVertexId) !== -1 &&
        vtxIds.indexOf(edge.targetVertexId) !== -1
      ) {
        edgeIds[edgeId] = JSON.parse(JSON.stringify(edge));
      }
    }

    return edgeIds;
  }

  public moveVertex(vtxId: string, x: number, y: number): void {
    const vtx = this.modelData.vertices[vtxId];
    if (vtx === undefined) throw new Error(`Could not find vertex with id ${vtxId}`);

    vtx.geo.x = x;
    vtx.geo.y = y;
  }

  public deleteVertex(vertexId: string): void {
    if (this.modelData.vertices[vertexId] === undefined) return;

    const connectedEdges = this.edgesByVertex[vertexId];
    for (const connectedEdge of connectedEdges) {
      this.deleteEdge(connectedEdge);
    }

    delete this.modelData.vertices[vertexId];
    delete this.edgesByVertex[vertexId];
  }

  public deleteEdge(edgeId: string): void {
    if (this.modelData.edges[edgeId] === undefined) return;

    const edge = this.modelData.edges[edgeId];

    delete this.modelData.edges[edgeId];

    this.edgesByVertex[edge.targetVertexId].delete(edgeId);
    this.edgesByVertex[edge.sourceVertexId].delete(edgeId);
  }

  public undo(): void {
    console.log("undo unimplemented");
  }

  public redo(): void {
    console.log("redo unimplemented");
  }

  public cloneVertex(newVtxId: string, oldVtxId: string, x: number, y: number): void {
    if (this.modelData.vertices[newVtxId] !== undefined) throw new Error(`Vertex with id ${newVtxId} already exists`);
    const oldVtx = this.modelData.vertices[oldVtxId];
    if (oldVtx === undefined) throw new Error(`Coudl not find vertex with id ${oldVtxId}`);

    const newVtx: VertexData = JSON.parse(JSON.stringify(oldVtx));
    newVtx.geo.x = x;
    newVtx.geo.y = y;

    this.createVertex(newVtxId, newVtx);
  }

  private createVertex(id: string, vtxData: VertexData): void {
    this.modelData.vertices[id] = vtxData;
    this.edgesByVertex[id] = new Set();
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

    this.edgesByVertex[sourceVtxId].add(edgeId);
    this.edgesByVertex[targetVtxId].add(edgeId);
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

    // return true if the target vertex is not an ancestor of the source vertex
    if (sourceAncestorIds.indexOf(targetVtxId) === -1) {
      return true;
    } else {
      return false;
    }
  }
}
