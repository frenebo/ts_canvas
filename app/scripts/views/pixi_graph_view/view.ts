import {
  ViewInterface, GraphData, ModelChangeRequest, ModelInfoRequestType, ModelInfoRequestMap, ModelInfoResponseMap,
  ModelVersioningRequest,
} from "../../interfaces.js";
import { GraphManager, GraphManagerCommand } from "./graphManager.js";
import { HtmlMenuBar } from "./htmlMenuBar.js";
import { KeyboardHandler } from "./keyboardHandler.js";
import { DialogManager } from "./dialogs/dialogManager.js";

export class PixiView implements ViewInterface {
  private data: GraphData = {vertices: {}, edges: {}};
  private readonly graphManager: GraphManager;
  private readonly menuBar: HtmlMenuBar;

  constructor(
    div: HTMLDivElement,
    sendModelChangeRequest: (req: ModelChangeRequest) => void,
    private readonly sendModelInfoRequest: <T extends ModelInfoRequestType>(req: ModelInfoRequestMap[T]) => ModelInfoResponseMap[T],
    sendModelVersioningRequest: (req: ModelVersioningRequest) => void,
  ) {
    const width = 1200;
    const menuBarHeight = 50;
    const graphHeight = 700;

    div.style.width = `${width}px`;
    div.style.height = `${menuBarHeight + graphHeight}px`;

    const menuBarDiv = document.createElement("div");
    menuBarDiv.style.position = "relative";
    div.appendChild(menuBarDiv);

    const graphDiv = document.createElement("div");
    graphDiv.style.position = "absolute";
    div.appendChild(graphDiv);

    const dialogs = new DialogManager(
      div,
      sendModelInfoRequest,
      sendModelVersioningRequest,
    );

    this.graphManager = new GraphManager(
      graphDiv,
      width,
      graphHeight,
      dialogs,
      sendModelChangeRequest,
      sendModelInfoRequest,
      sendModelVersioningRequest,
    );

    const keyboardHandler = new KeyboardHandler(
      div,
      dialogs,
      this.graphManager.getSelectionManager(),
      sendModelChangeRequest,
      sendModelInfoRequest,
      sendModelVersioningRequest,
    );

    this.menuBar = new HtmlMenuBar(
      menuBarDiv,
      width,
      menuBarHeight,
      dialogs,
      keyboardHandler,
      this.graphManager.getSelectionManager(),
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
    }

    for (const removedVertexKey of removedVertexKeys) {
      graphManagerCommands.push({
        type: "removeVertex",
        vertexKey: removedVertexKey,
      });
    }

    for (const addedVertexKey of addedVertexKeys) {
      graphManagerCommands.push({
        type: "addVertex",
        vertexKey: addedVertexKey,
        vertexData: newData.vertices[addedVertexKey],
      });
    }

    for (const sharedVertexKey of sharedVertexKeys) {
      // may have false positive, but not false negative
      if (JSON.stringify(this.data.vertices[sharedVertexKey]) !== JSON.stringify(newData.vertices[sharedVertexKey])) {
        graphManagerCommands.push({
          type: "updateVertex",
          vertexKey: sharedVertexKey,
          vertexData: newData.vertices[sharedVertexKey],
        });
      }
    }

    // add back an edge if its data changed
    for (const addedEdgeKey of addedEdgeKeys.concat(changedEdgeKeys)) {
      graphManagerCommands.push({
        type: "addEdge",
        edgeKey: addedEdgeKey,
        edgeData: newData.edges[addedEdgeKey],
      });
    }

    // all changes are done at once inside here so graphManager can wait until all changes are made to do expensive
    // updates
    this.graphManager.applyCommands(graphManagerCommands);

    this.data = JSON.parse(JSON.stringify(newData));
    const fileData = this.sendModelInfoRequest<"fileIsOpen">({type: "fileIsOpen"});
    const unsavedChanges = !fileData.fileIsOpen || !fileData.fileIsUpToDate;
    this.menuBar.setUnsavedChanges(unsavedChanges)
  }
}
