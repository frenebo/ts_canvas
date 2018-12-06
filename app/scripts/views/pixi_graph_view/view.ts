import {
  ViewInterface,
  GraphData,
  ModelChangeRequest,
  ModelVersioningRequest,
  ModelInfoReqs,
} from "../../interfaces.js";
import {
  GraphManager,
  GraphManagerCommand,
} from "./graphManager.js";
import { HtmlMenuBar } from "./htmlMenuBar.js";
import { KeyboardHandler } from "./keyboardHandler.js";
import { DialogManager } from "./dialogs/dialogManager.js";

export class PixiView implements ViewInterface {
  private data: GraphData = {vertices: {}, edges: {}};
  private readonly graphManager: GraphManager;
  private readonly menuBar: HtmlMenuBar;

  constructor(
    div: HTMLDivElement,
    sendModelChangeRequest: (...reqs: ModelChangeRequest[]) => Promise<boolean>,
    private readonly sendModelInfoRequest: <T extends keyof ModelInfoReqs>(req: ModelInfoReqs[T]["request"]) => Promise<ModelInfoReqs[T]["response"]>,
    sendModelVersioningRequest: (req: ModelVersioningRequest) => Promise<boolean>,
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
      if (document.documentElement === null) return;
      console.log()
      this.menuBar.setWidth(window.innerWidth);
      this.graphManager.setDimensions(window.innerWidth, window.innerHeight - HtmlMenuBar.menuHeight);
    }

    window.addEventListener("resize", onResize);

    const menuBarDiv = document.createElement("div");
    menuBarDiv.style.position = "relative";
    div.appendChild(menuBarDiv);

    const graphDiv = document.createElement("div");
    graphDiv.style.position = "absolute";
    div.appendChild(graphDiv);

    const dialogs = new DialogManager(
      div,
      sendModelChangeRequest,
      sendModelInfoRequest,
      sendModelVersioningRequest,
    );

    this.graphManager = new GraphManager(
      graphDiv,
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
      dialogs,
      keyboardHandler,
      this.graphManager.getSelectionManager(),
      sendModelChangeRequest,
      sendModelInfoRequest,
      sendModelVersioningRequest,
    );
    onResize();
  }

  public async setGraphData(newData: GraphData): Promise<void> {
    const newVertexKeys = Object.keys(newData.vertices);
    const oldVertexKeys = Object.keys(this.data.vertices);

    const removedVertexKeys = oldVertexKeys.filter((key) => newVertexKeys.indexOf(key) === -1);
    const addedVertexKeys = newVertexKeys.filter((key) => oldVertexKeys.indexOf(key) === -1);
    const sharedVertexKeys = oldVertexKeys.filter((key) => newVertexKeys.indexOf(key) !== -1);

    const newEdgeKeys = Object.keys(newData.edges);
    const oldEdgeKeys = Object.keys(this.data.edges);

    const removedEdgeKeys = oldEdgeKeys.filter((key) => newEdgeKeys.indexOf(key) === -1);
    const addedEdgeKeys = newEdgeKeys.filter((key) => oldEdgeKeys.indexOf(key) === -1);
    const sharedEdgeKeys = oldEdgeKeys.filter((key) => newEdgeKeys.indexOf(key) !== -1);
    const changedEdgeKeys = sharedEdgeKeys.filter((key) => {
      const newEdge = newData.edges[key];
      const oldEdge = this.data.edges[key];

      return JSON.stringify(newEdge) !== JSON.stringify(oldEdge);
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


    this.data = JSON.parse(JSON.stringify(newData));
    const fileData = await this.sendModelInfoRequest<"fileIsOpen">({type: "fileIsOpen"})
    const unsavedChanges = !fileData.fileIsOpen || !fileData.fileIsUpToDate;
    this.menuBar.setUnsavedChanges(unsavedChanges);

    // all changes are done at once inside here so graphManager can wait until all changes are made to do expensive
    // updates
    this.graphManager.applyCommands(graphManagerCommands);
  }
}
