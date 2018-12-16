
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

    const dialogs = new DialogManager(
      div,
      sendModelChangeRequests,
      sendModelInfoRequests,
      sendModelVersioningRequest,
    );

    this.graphManager = new GraphManager(
      graphDiv,
      dialogs,
      sendModelChangeRequests,
      sendModelInfoRequests,
    );

    const keyboardHandler = new KeyboardHandler(
      div,
      dialogs,
      this.graphManager.getSelectionManager(),
      sendModelChangeRequests,
      sendModelInfoRequests,
      sendModelVersioningRequest,
    );

    this.menuBar = new HtmlMenuBar(
      menuBarDiv,
      dialogs,
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

    for (const edgeKey of removedEdgeKeys) {
      if (addedEdgeKeys.has(edgeKey)) {
        removedEdgeKeys.delete(edgeKey);
        addedEdgeKeys.delete(edgeKey);

        const newEdge = newData.edges[edgeKey];
        const oldEdge = this.data.edges[edgeKey];

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

    this.data = JSON.parse(JSON.stringify(newData));

    // all changes are done at once inside here so graphManager can wait until all changes are made to do expensive
    // updates
    this.graphManager.applyCommands(graphManagerCommands);

    const fileData = await this.sendModelInfoRequests<"fileIsOpen">({type: "fileIsOpen"});
    const unsavedChanges = !fileData.fileIsOpen || !fileData.fileIsUpToDate;
    this.menuBar.setUnsavedChanges(unsavedChanges);
  }
}