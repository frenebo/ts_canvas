import {
  ViewInterface, ModelData, ModelChangeRequest, ModelInfoRequestType, ModelInfoRequestMap, ModelInfoResponseMap, ModelVersioningRequest,
} from "../../interfaces.js";
import { PixiAdapter } from "./pixiAdapter.js";

export class PixiView implements ViewInterface {
  private static edgesByVertex(data: ModelData) {
    const edgesByVertex: {[key: string]: string[]} = {};
    for (const vertexId in data.vertices) {
      edgesByVertex[vertexId] = [];
    }
    for (const edgeId in data.edges) {
      const edge = data.edges[edgeId];

      edgesByVertex[edge.sourceVertexId].push(edgeId);
      edgesByVertex[edge.targetVertexId].push(edgeId);
    }

    return edgesByVertex;
  }

  private data: ModelData = {vertices: {}, edges: {}};
  private readonly pixiAdapter: PixiAdapter;

  constructor(
    div: HTMLDivElement,
    sendModelChangeRequest: (req: ModelChangeRequest) => void,
    sendModelInfoRequest: <T extends ModelInfoRequestType>(req: ModelInfoRequestMap[T]) => ModelInfoResponseMap[T],
    sendModelVersioningRequest: (req: ModelVersioningRequest) => void,
  ) {
    this.pixiAdapter = new PixiAdapter(div, sendModelChangeRequest, sendModelInfoRequest, sendModelVersioningRequest);
  }

  public setModelData(newData: ModelData): void {
    const newVertexKeys = Object.keys(newData.vertices);
    const oldVertexKeys = Object.keys(this.data.vertices);

    const removedVertexKeys = oldVertexKeys.filter((key) => newVertexKeys.indexOf(key) === -1);
    const addedVertexKeys = newVertexKeys.filter((key) => oldVertexKeys.indexOf(key) === -1);
    const sharedVertexKeys = oldVertexKeys.filter((key) => newVertexKeys.indexOf(key) !== -1);

    const newEdgeKeys = Object.keys(newData.edges);
    const oldEdgeKeys = Object.keys(this.data.edges);

    const removedEdgeKeys = oldEdgeKeys.filter((key) => newEdgeKeys.indexOf(key) === -1);
    const addedEdgeKeys = newEdgeKeys.filter((key) => oldEdgeKeys.indexOf(key) === -1);
    const sharedEdgeKeys = oldEdgeKeys.filter((key) => newEdgeKeys.indexOf(key) === 1);
    const changedEdgeKeys = sharedEdgeKeys.filter((key) => {
      const newEdge = newData.edges[key];
      const oldEdge = this.data.edges[key];

      if (newEdge.sourcePortId !== oldEdge.sourcePortId) return true;
      if (newEdge.sourceVertexId !== oldEdge.sourceVertexId) return true;
      if (newEdge.targetPortId !== oldEdge.targetPortId) return true;
      if (newEdge.targetVertexId !== oldEdge.targetVertexId) return true;

      return true;
    });

    // remove an edge if its data changed
    for (const removedEdgeKey of removedEdgeKeys.concat(changedEdgeKeys)) {
      this.pixiAdapter.removeEdge(removedEdgeKey);
    }

    for (const removedVertexKey of removedVertexKeys) {
      this.pixiAdapter.removeVertex(removedVertexKey);
    }

    for (const addedVertexKey of addedVertexKeys) {
      this.pixiAdapter.createVertex(addedVertexKey, newData.vertices[addedVertexKey]);
    }

    for (const sharedVertexKey of sharedVertexKeys) {
      this.pixiAdapter.updateVertex(sharedVertexKey, newData.vertices[sharedVertexKey]);
    }

    // add back an edge if its data changed
    for (const addedEdgeKey of addedEdgeKeys.concat(changedEdgeKeys)) {
      this.pixiAdapter.addEdge(addedEdgeKey, newData.edges[addedEdgeKey]);
    }

    // refresh edges connected to changed vertices
    const edgesByVertex = PixiView.edgesByVertex(newData);
    const edgesToUpdate = new Set<string>();
    for (const vertexKey of sharedVertexKeys) {
      // @NOTE May decide identical vertices to be different if their attributes are in different order, but will never
      // decide different vertices to be identical
      if (JSON.stringify(this.data.vertices[vertexKey]) !== JSON.stringify(newData.vertices[vertexKey])) {
        for (const edgeId of edgesByVertex[vertexKey]) {
          edgesToUpdate.add(edgeId);
        }
      }
    }
    for (const edgeToUpdate of edgesToUpdate) {
      this.pixiAdapter.refreshEdge(edgeToUpdate);
    }

    this.data = JSON.parse(JSON.stringify(newData));
  }
}
