import {
  ViewInterface, GraphData, ModelChangeRequest, ModelInfoRequestType, ModelInfoRequestMap, ModelInfoResponseMap,
  ModelVersioningRequest,
} from "../../interfaces.js";
import { GraphManager, GraphManagerCommand } from "./graphManager.js";
import { createDiff } from "../../diff.js";
// import { PixiAdapter } from "./pixiAdapter.js";

export class PixiView implements ViewInterface {
  private data: GraphData = {vertices: {}, edges: {}};
  private readonly graphManager: GraphManager;

  constructor(
    div: HTMLDivElement,
    sendModelChangeRequest: (req: ModelChangeRequest) => void,
    sendModelInfoRequest: <T extends ModelInfoRequestType>(req: ModelInfoRequestMap[T]) => ModelInfoResponseMap[T],
    sendModelVersioningRequest: (req: ModelVersioningRequest) => void,
  ) {
    this.graphManager = new GraphManager(
      div,
      sendModelChangeRequest,
      sendModelInfoRequest,
      sendModelVersioningRequest,
    );
  }

  public setGraphData(newData: GraphData): void {
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

      return false;
    });

    const graphManagerCommands: GraphManagerCommand[] = [];

    // remove an edge if its data changed
    for (const removedEdgeKey of removedEdgeKeys.concat(changedEdgeKeys)) {
      graphManagerCommands.push({
        type: "removeEdge",
        edgeKey: removedEdgeKey,
        edgeData: this.data.edges[removedEdgeKey],
      });
      // this.graphManager.removeEdge(removedEdgeKey, this.data.edges[removedEdgeKey]);
    }

    for (const removedVertexKey of removedVertexKeys) {
      graphManagerCommands.push({
        type: "removeVertex",
        vertexKey: removedVertexKey,
      });
      // this.graphManager.removeVertex(removedVertexKey);
    }

    for (const addedVertexKey of addedVertexKeys) {
      graphManagerCommands.push({
        type: "addVertex",
        vertexKey: addedVertexKey,
        vertexData: newData.vertices[addedVertexKey],
      });
      // this.graphManager.addVertex(addedVertexKey, newData.vertices[addedVertexKey]);
    }

    for (const sharedVertexKey of sharedVertexKeys) {
      if (createDiff(this.data.vertices[sharedVertexKey] as any, newData.vertices[sharedVertexKey] as any).length !== 0) {
        graphManagerCommands.push({
          type: "updateVertex",
          vertexKey: sharedVertexKey,
          vertexData: newData.vertices[sharedVertexKey],
        });
      }
      // this.graphManager.updateVertex(sharedVertexKey, newData.vertices[sharedVertexKey]);
    }

    // add back an edge if its data changed
    for (const addedEdgeKey of addedEdgeKeys.concat(changedEdgeKeys)) {
      graphManagerCommands.push({
        type: "addEdge",
        edgeKey: addedEdgeKey,
        edgeData: newData.edges[addedEdgeKey],
      });
      // this.graphManager.addEdge(addedEdgeKey, newData.edges[addedEdgeKey]);
    }

    // all changes are done at once inside here so graphManager can wait until all changes are made to do expensive
    // updates
    this.graphManager.applyCommands(graphManagerCommands);

    this.data = JSON.parse(JSON.stringify(newData));
  }
}
