import { ViewInterface, ModelData, ModelChangeRequest, ModelInfoRequestType, ModelInfoRequestMap, ModelInfoResponseMap } from "../../interfaces.js";
import { PixiAdapter } from "./pixiAdapter.js";

export class PixiView implements ViewInterface {
  private data: ModelData = {vertices: {}, edges: {}};
  private pixiAdapter: PixiAdapter;

  constructor(
    div: HTMLDivElement,
    sendModelChangeRequest: (req: ModelChangeRequest) => void,
    sendModelInfoRequest: <T extends ModelInfoRequestType>(req: ModelInfoRequestMap[T]) => ModelInfoResponseMap[T],
  ) {
    this.pixiAdapter = new PixiAdapter(div, sendModelChangeRequest, sendModelInfoRequest);
  }

  public setModelData(newData: ModelData): void {
    const newVertexKeys = Object.keys(newData.vertices);
    const oldVertexKeys = Object.keys(this.data.vertices);

    const removedVertexKeys = oldVertexKeys.filter(key => newVertexKeys.indexOf(key) === -1);
    const addedVertexKeys = newVertexKeys.filter(key => oldVertexKeys.indexOf(key) === -1);
    const sharedVertexKeys = oldVertexKeys.filter(key => newVertexKeys.indexOf(key) !== -1);
    console.log(addedVertexKeys);

    const newEdgeKeys = Object.keys(newData.edges);
    const oldEdgeKeys = Object.keys(this.data.edges);

    const removedEdgeKeys = oldEdgeKeys.filter(key => newEdgeKeys.indexOf(key) === -1);
    const addedEdgeKeys = newEdgeKeys.filter(key => oldEdgeKeys.indexOf(key) === -1);
    const sharedEdgeKeys = oldEdgeKeys.filter(key => newEdgeKeys.indexOf(key) === 1);
    const changedEdgeKeys = sharedEdgeKeys.filter(key => JSON.stringify(newData.edges[key]) !== JSON.stringify(this.data.edges[key]));

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

    for (const addedEdgeKey of addedEdgeKeys.concat(changedEdgeKeys)) {
      this.pixiAdapter.addEdge(addedEdgeKey, newData.edges[addedEdgeKey]);
    }

    this.data = JSON.parse(JSON.stringify(newData));
  }
}
