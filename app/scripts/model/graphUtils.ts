import {
  IEdgeData,
  IGraphData,
  IModelInfoReqs,
  IVertexData,
} from "../interfaces.js";
import { Layer } from "./layers/layers.js";

export interface IEdgesByVertex {
  [key: string]: {
    in: string[];
    out: string[];
  };
}

export class GraphUtils {
  public static edgesBetweenVertices(args: {
    graphData: IGraphData;
    edgesByVertex: IEdgesByVertex;
    vtxIds: string[];
  }): IModelInfoReqs["edgesBetweenVertices"]["response"] {
    const nonexistentVertices: string[] = [];
    for (const vtxId of args.vtxIds) {
      if (args.graphData.vertices[vtxId] === undefined) {
        nonexistentVertices.push(vtxId);
      }
    }
    if (nonexistentVertices.length !== 0) {
      return {
        requestNonexistentVertices: nonexistentVertices,
        verticesExist: false,
      };
    }

    const vtxOutputEdges = new Set<string>();
    const vtxInputEdges = new Set<string>();

    for (const vtxId of args.vtxIds) {
      for (const outEdgeId of args.edgesByVertex[vtxId].out) {
        vtxOutputEdges.add(outEdgeId);
      }
      for (const inEdgeId of args.edgesByVertex[vtxId].in) {
        vtxInputEdges.add(inEdgeId);
      }
    }

    const edgesBetween: {[key: string]: IEdgeData} = {};

    for (const edgeId of vtxOutputEdges) {
      if (vtxInputEdges.has(edgeId)) {
        edgesBetween[edgeId] = args.graphData.edges[edgeId];
      }
    }

    return {
      edges: edgesBetween,
      verticesExist: true,
    };
  }

  public static getUniqueEdgeIds(args: {
    graphData: IGraphData;
    count: number;
  }): IModelInfoReqs["getUniqueEdgeIds"]["response"] {
    const ids = new Set<string>();

    while (ids.size < args.count) {
      const randomVal = Math.random();
      let multiple = 10;
      let id: string;
      while (
        args.graphData.edges[id = Math.floor(randomVal * multiple).toString()] !== undefined ||
        ids.has(id)
      ) {
        multiple *= 100;
      }
      ids.add(id);
    }

    return {
      edgeIds: Array.from(ids),
    };
  }

  public static getUniqueVertexIds(args: {
    graphData: IGraphData;
    count: number;
  }): IModelInfoReqs["getUniqueVertexIds"]["response"] {
    const ids = new Set<string>();

    while (ids.size < args.count) {
      const randomVal = Math.random();
      let multiple = 100;
      let id: string;
      while (
        args.graphData.vertices[id = Math.floor(randomVal * multiple).toString()] !== undefined ||
        ids.has(id)
      ) {
        multiple *= 10;
      }
      ids.add(id);
    }

    return {
      vertexIds: Array.from(ids),
    };
  }

  public static validateMoveVertex(args: {
    graphData: IGraphData;
    vtxId: string;
    x: number;
    y: number;
  }): null | string {
    if (args.graphData.vertices[args.vtxId] === undefined) {
      return `Vertex with id ${args.vtxId} does not exist`;
    }

    return null;
  }

  public static moveVertex(args: {
    graphData: IGraphData;
    vtxId: string;
    x: number;
    y: number;
  }): void {
    const vtx = args.graphData.vertices[args.vtxId];
    if (vtx === undefined) {
      throw new Error(`Could not find vertex with id ${args.vtxId}`);
    }

    vtx.geo.x = args.x;
    vtx.geo.y = args.y;
  }

  public static validateDeleteVertex(args: {
    graphData: IGraphData;
    edgesByVertex: IEdgesByVertex;
    vertexId: string;
  }): string | null {
    if (args.graphData.vertices[args.vertexId] === undefined) {
      return `Could not find vertex with id ${args.vertexId}`;
    }

    return null;
  }

  public static deleteVertex(args: {
    graphData: IGraphData;
    edgesByVertex: IEdgesByVertex;
    vertexId: string;
  }): void {
    if (args.graphData.vertices[args.vertexId] === undefined) {
      throw new Error(`Could not find vertex with id ${args.vertexId}`);
    }

    const connectedEdges: string[] = [];
    for (const edgeId in args.graphData.edges) {
      if (
        args.graphData.edges[edgeId].sourceVertexId === args.vertexId ||
        args.graphData.edges[edgeId].targetVertexId === args.vertexId
      ) {
        connectedEdges.push(edgeId);
      }
    }
    for (const connectedEdge of connectedEdges) {
      this.deleteEdge({
        edgeId: connectedEdge,
        edgesByVertex: args.edgesByVertex,
        graphData: args.graphData,
      });
    }

    delete args.graphData.vertices[args.vertexId];
    delete args.edgesByVertex[args.vertexId];
  }

  public static deleteEdge(args: {
    graphData: IGraphData;
    edgesByVertex: IEdgesByVertex;
    edgeId: string;
  }): void {
    if (args.graphData.edges[args.edgeId] === undefined) {
      throw new Error(`Could not find edge with id ${args.edgeId}`);
    }

    const edge = args.graphData.edges[args.edgeId];
    const inIdx = args.edgesByVertex[edge.sourceVertexId].out.indexOf(args.edgeId);
    args.edgesByVertex[edge.sourceVertexId].out.splice(inIdx, 1);
    const outIdx = args.edgesByVertex[edge.targetVertexId].in.indexOf(args.edgeId);
    args.edgesByVertex[edge.targetVertexId].in.splice(outIdx, 1);

    delete args.graphData.edges[args.edgeId];
  }

  public static validateDeleteEdge(args: {
    graphData: IGraphData;
    edgesByVertex: IEdgesByVertex;
    edgeId: string;
  }): string | null {
    if (args.graphData.edges[args.edgeId] === undefined) {
      return `Could not find edge with id ${args.edgeId}`;
    }

    return null;
  }

  public static validateCloneVertex(args: {
    graphData: IGraphData;
    edgesByVertex: IEdgesByVertex;
    newVtxId: string;
    oldVtxId: string;
    x: number;
    y: number;
  }): string | null {
    if (args.graphData.vertices[args.oldVtxId] === undefined) {
      return `Vertex with id ${args.oldVtxId} does not exist`;
    }

    if (args.graphData.vertices[args.newVtxId] !== undefined) {
      return `Vertex with id ${args.newVtxId} already exists`;
    }

    const oldVtx = args.graphData.vertices[args.oldVtxId];
    if (oldVtx === undefined) {
      return `Could not find vertex with id ${args.oldVtxId}`;
    }

    return null;
  }

  public static cloneVertex(args: {
    graphData: IGraphData;
    edgesByVertex: IEdgesByVertex;
    newVtxId: string;
    oldVtxId: string;
    x: number;
    y: number;
  }): void {
    if (args.graphData.vertices[args.newVtxId] !== undefined) {
      throw new Error(`Vertex with id ${args.newVtxId} already exists`);
    }

    const oldVtx = args.graphData.vertices[args.oldVtxId];
    if (oldVtx === undefined) {
      throw new Error(`Coudl not find vertex with id ${args.oldVtxId}`);
    }

    const newVtx: IVertexData = JSON.parse(JSON.stringify(oldVtx));
    newVtx.geo.x = args.x;
    newVtx.geo.y = args.y;

    this.addVertex({
      edgesByVertex: args.edgesByVertex,
      graphData: args.graphData,
      id: args.newVtxId,
      vtxData: newVtx,
    });
  }

  public static createVertexFromLayer(args: {
    layer: Layer;
    x?: number;
    y?: number;
  }): IVertexData {
    const vtxData: IVertexData = {
      geo: {
        x: args.x === undefined ? 0 : args.x,
        y: args.y === undefined ? 0 : args.y,
      },
      label: args.layer.getType(),
      ports: {},
    };
    const inputPortCount = args.layer.getPortIds().filter((id) => args.layer.getPortInfo(id).type === "input").length;
    const outputPortCount = args.layer.getPortIds().filter((id) => args.layer.getPortInfo(id).type === "output").length;

    let inputPortIdx = 0;
    let outputPortIdx = 0;
    for (const portId of args.layer.getPortIds()) {
      const portInfo = args.layer.getPortInfo(portId);
      vtxData.ports[portId] = {
        portType: portInfo.type,
        position: portInfo.type === "input" ? (
          1 / (inputPortCount + 1) * ++inputPortIdx
        ) : (
          1 / (outputPortCount + 1) * ++outputPortIdx
        ),
        side: portInfo.type === "input" ? "top" : "bottom",
      };
    }
    return vtxData;
  }

  public static addVertex(args: {
    graphData: IGraphData;
    edgesByVertex: IEdgesByVertex;
    id: string;
    vtxData: IVertexData;
  }): void {
    args.graphData.vertices[args.id] = args.vtxData;
    args.edgesByVertex[args.id] = {in: [], out: []};
  }

  public static createEdge(args: {
    graphData: IGraphData;
    edgesByVertex: IEdgesByVertex;
    newEdgeId: string;
    sourceVtxId: string;
    sourcePortId: string;
    targetVtxId: string;
    targetPortId: string;
  }): void {
    const edgeValidationMessage = this.validateCreateEdge(args);

    if (edgeValidationMessage !== null) {
      throw new Error(`Invalid edge: ${edgeValidationMessage}`);
    }

    const edge: IEdgeData = {
      consistency: "consistent",
      sourcePortId: args.sourcePortId,
      sourceVertexId: args.sourceVtxId,
      targetPortId: args.targetPortId,
      targetVertexId: args.targetVtxId,
    };
    args.graphData.edges[args.newEdgeId] = edge;
    args.edgesByVertex[edge.sourceVertexId].out.push(args.newEdgeId);
    args.edgesByVertex[edge.targetVertexId].in.push(args.newEdgeId);
  }

  public static validateCreateEdge(args: {
    graphData: IGraphData;
    edgesByVertex: IEdgesByVertex;
    newEdgeId: string;
    sourceVtxId: string;
    sourcePortId: string;
    targetVtxId: string;
    targetPortId: string;
  }): string | null {
    if (args.graphData.edges[args.newEdgeId] !== undefined) {
      return `Edge with id ${args.newEdgeId} already exists`;
    }

    const sourceVertex = args.graphData.vertices[args.sourceVtxId];
    const targetVertex = args.graphData.vertices[args.targetVtxId];
    if (sourceVertex === undefined) {
      return "Source does not exist";
    }
    if (targetVertex === undefined) {
      return "Target does not exist";
    }

    const sourcePort = sourceVertex.ports[args.sourcePortId];
    const targetPort = targetVertex.ports[args.targetPortId];

    if (sourcePort === undefined) {
      return "Source port does not exist";
    }
    if (targetPort === undefined) {
      return "Target port does not exist";
    }

    if (sourcePort.portType !== "output") {
      return "Source is not an output port";
    }
    if (targetPort.portType !== "input") {
      return "Target is not an input port";
    }

    // check that there isn't an identical edge present
    const sourceOutEdges = args.edgesByVertex[args.sourceVtxId].out;
    const targetInEdges = args.edgesByVertex[args.targetVtxId].in;
    const edgesFromSourceToTarget = sourceOutEdges.filter((edgeId) => targetInEdges.indexOf(edgeId) !== -1);
    for (const edgeId of edgesFromSourceToTarget) {
      const edge = args.graphData.edges[edgeId];

      // check if the edge is identical
      if (edge.sourcePortId === args.sourcePortId && edge.targetPortId === args.targetPortId) {
        return "Identical connection already exists";
      }
    }

    // Loop detection
    const sourceAncestorIds: string[] = [];

    const vertexIdsToInvestigate: string[] = [args.sourceVtxId];
    while (vertexIdsToInvestigate.length > 0) {
      const vtxIdToInvestigate = vertexIdsToInvestigate.pop() as string;
      sourceAncestorIds.push(vtxIdToInvestigate);

      for (const edgeId of args.edgesByVertex[vtxIdToInvestigate].in) {
        const edgeData = args.graphData.edges[edgeId];
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
    if (sourceAncestorIds.indexOf(args.targetVtxId) === -1) {
      return null;
    } else {
      return "Loop detected";
    }
  }
}
