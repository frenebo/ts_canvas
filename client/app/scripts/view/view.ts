
import {
  RequestInfoFunc,
  RequestModelChangesFunc,
  RequestVersioningChangeFunc,
} from "../messenger.js";
import { DialogManager } from "./dialogs/dialogManager.js";
import {
  GraphManager,
  GraphManagerCommand,
} from "./graphManager.js";
import { HtmlMenuBar } from "./htmlMenuBar.js";
import { KeyboardHandler } from "./keyboardHandler.js";

export class View implements IViewInterface {
  private data: IGraphData = {vertices: {}, edges: {}};
  private readonly graphManager: GraphManager;
  private readonly menuBar: HtmlMenuBar;

  constructor(
    div: HTMLDivElement,
    sendModelChangeRequests: RequestModelChangesFunc,
    private readonly sendModelInfoRequests: RequestInfoFunc,
    sendModelVersioningRequest: RequestVersioningChangeFunc,
  ) {
    document.body.style.margin = "0px";
    document.body.style.width = "100%";
    document.body.style.height = "100%";
    document.body.style.overflow = "hidden";
    document.documentElement!.style.margin = "0px";
    document.documentElement!.style.width = "100%";
    document.documentElement!.style.height = "100%";
    document.documentElement!.style.overflow = "hidden";
    // div.style.width = "100%";
    // div.style.height = "100%";
    const onResize = () => {
      if (document.documentElement === null) {
        return;
      }
      this.menuBar.setWidth(window.innerWidth);
      this.graphManager.setDimensions(window.innerWidth, window.innerHeight - HtmlMenuBar.menuHeight);
    };

    window.addEventListener("resize", onResize);

    const menuBarDiv = document.createElement("div");
    menuBarDiv.style.position = "relative";
    div.appendChild(menuBarDiv);

    const graphDiv = document.createElement("div");
    graphDiv.style.position = "absolute";
    div.appendChild(graphDiv);

    const dialogManager = new DialogManager(
      div,
      sendModelChangeRequests,
      sendModelInfoRequests,
      sendModelVersioningRequest,
    );

    this.graphManager = new GraphManager(
      graphDiv,
      dialogManager,
      sendModelChangeRequests,
      sendModelInfoRequests,
    );

    const keyboardHandler = new KeyboardHandler(
      div,
      dialogManager,
      this.graphManager.getSelectionManager(),
      sendModelChangeRequests,
      sendModelInfoRequests,
      sendModelVersioningRequest,
    );

    this.menuBar = new HtmlMenuBar(
      menuBarDiv,
      dialogManager,
      keyboardHandler,
      this.graphManager.getSelectionManager(),
      sendModelChangeRequests,
      sendModelInfoRequests,
      sendModelVersioningRequest,
    );
    onResize();
  }

  public async setGraphData(newData: IGraphData): Promise<void> {
    const removedVertexKeys = new Set(Object.keys(this.data.vertices));
    const addedVertexKeys = new Set(Object.keys(newData.vertices));
    const sharedVertexKeys = new Set<string>();

    for (const vertexKey of removedVertexKeys) {
      if (addedVertexKeys.has(vertexKey)) {
        removedVertexKeys.delete(vertexKey);
        addedVertexKeys.delete(vertexKey);
        sharedVertexKeys.add(vertexKey);
      }
    }

    const removedEdgeKeys = new Set(Object.keys(this.data.edges));
    const addedEdgeKeys = new Set(Object.keys(newData.edges));
    const changedEdgeKeys = new Set<string>();

    // this takes the edges in common between removed and added,
    // then either removes them if the edge is unchanged, or ads to changedEdgeKeys
    // if the edge has changed
    for (const edgeKey of removedEdgeKeys) {
      if (addedEdgeKeys.has(edgeKey)) {
        removedEdgeKeys.delete(edgeKey);
        addedEdgeKeys.delete(edgeKey);

        const newEdge = newData.edges[edgeKey];
        const oldEdge = this.data.edges[edgeKey];

        // may be wrong sometimes, but only in marking edges that are the same as different.
        // If two edges are different, this will always mark the edges as changed
        if (JSON.stringify(newEdge) !== JSON.stringify(oldEdge)) {
          changedEdgeKeys.add(edgeKey);
        }
      }
    }

    const graphManagerCommands: GraphManagerCommand[] = [];

    // remove an edge if its data changed
    for (const removedEdgeKey of [...removedEdgeKeys, ...changedEdgeKeys]) {
      graphManagerCommands.push({
        edgeData: this.data.edges[removedEdgeKey],
        edgeKey: removedEdgeKey,
        type: "removeEdge",
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
        vertexData: newData.vertices[addedVertexKey],
        vertexKey: addedVertexKey,
      });
    }

    for (const sharedVertexKey of sharedVertexKeys) {
      // may have false positive, but not false negative
      if (JSON.stringify(this.data.vertices[sharedVertexKey]) !== JSON.stringify(newData.vertices[sharedVertexKey])) {
        graphManagerCommands.push({
          type: "updateVertex",
          vertexData: newData.vertices[sharedVertexKey],
          vertexKey: sharedVertexKey,
        });
      }
    }

    // add back an edge if its data changed
    for (const addedEdgeKey of [...addedEdgeKeys, ...changedEdgeKeys]) {
      graphManagerCommands.push({
        edgeData: newData.edges[addedEdgeKey],
        edgeKey: addedEdgeKey,
        type: "addEdge",
      });
    }

    // Copies newData
    this.data = JSON.parse(JSON.stringify(newData));

    // all changes are done at once in applyCommands.
    // The reason for this is so that graphManager only does things like refreshing edges once
    // after a set of changes, instead of refreshing the graph once for each change made
    this.graphManager.applyCommands(graphManagerCommands);

    // This non-urgent request serves to update the unsaved changes notification.
    this.sendModelInfoRequests<"fileIsOpen">({type: "fileIsOpen"}).then((fileData) => {
      const unsavedChanges = !fileData.fileIsOpen || !fileData.fileIsUpToDate;
      this.menuBar.setUnsavedChanges(unsavedChanges);
    });
  }
}
