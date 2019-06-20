
import {
  RequestInfoFunc,
  RequestModelChangesFunc,
} from "../messenger.js";
import { CullingManager } from "./cullingManager/cullingManager.js";
import { DialogManager } from "./dialogs/dialogManager.js";
import { DragRegistry } from "./dragAndSelection/dragRegistry.js";
import { EdgeWrapper } from "./graphicWrappers/edgeWrapper.js";
import { EditIconWrapper } from "./graphicWrappers/editIconWrapper.js";
import { PortWrapper } from "./graphicWrappers/portWrapper.js";
import { VertexWrapper } from "./graphicWrappers/vertexWrapper.js";
import { PortPreviewManager } from "./portPreviewManager.js";
import { SelectionManager } from "./selectionManager.js";
import { StageManager } from "./stageManager.js";

export type GraphManagerCommand = {
  type: "removeEdge";
  edgeKey: string;
  edgeData: IEdgeData;
} | {
  type: "removeVertex";
  vertexKey: string;
} | {
  type: "addVertex";
  vertexKey: string;
  vertexData: IVertexData;
} | {
  type: "addEdge";
  edgeKey: string;
  edgeData: IEdgeData;
} | {
  type: "updateVertex";
  vertexKey: string;
  vertexData: IVertexData;
};

/** Class for managing a PIXI graph */
export class GraphManager {
  private readonly vertexWrappers: {
    [vertexKey: string]: VertexWrapper;
  } = {};
  private readonly ports: {
    [vertexKey: string]: {
      [portKey: string]: PortWrapper;
    };
  } = {};
  private readonly portEdges: {
    [vertexKey: string]: {
      [portKey: string]: string[]; // edge ids
    };
  } = {};
  private readonly edgeWrappers: {
    [edgeKey: string]: EdgeWrapper;
  } = {};

  private readonly stageManager: StageManager;
  private readonly selectionManager: SelectionManager;
  private readonly dragRegistry: DragRegistry;
  private readonly cullingManager: CullingManager;
  private readonly portPreviewManager: PortPreviewManager;

  /**
   * Constructs a graph manager.
   * @param div - The HTML div for the graph to go in
   * @param dialogs - The dialog manager for the graph to use
   * @param sendModelChangeRequests - A function for sending the server model change requests
   * @param sendModelInfoRequests - A function for sending the server model info requests
   */
  constructor(
    private readonly div: HTMLDivElement,
    private readonly dialogs: DialogManager,
    sendModelChangeRequests: RequestModelChangesFunc,
    sendModelInfoRequests: RequestInfoFunc,
  ) {
    this.stageManager = new StageManager(div);
    this.selectionManager = new SelectionManager(
      () => this.vertexWrappers,
      () => this.edgeWrappers,
      sendModelChangeRequests,
      sendModelInfoRequests,
      this.stageManager.getStageInterface(),
    );

    this.portPreviewManager = new PortPreviewManager(
      this.stageManager.getStageInterface(),
    );

    this.dragRegistry = new DragRegistry(
      sendModelChangeRequests,
      sendModelInfoRequests,
      this.selectionManager,
      this.portPreviewManager,
      this.stageManager.getStageInterface(),
    );

    this.cullingManager = new CullingManager(
      this.stageManager.getStageInterface(),
    );
  }

  /**
   * Sets the dimensions of the stage.
   * @param w - The stage width
   * @param h - The stage height
   */
  public setDimensions(w: number, h: number): void {
    this.stageManager.setDimensions(w, h);
    this.div.style.width = `${w}px`;
    this.div.style.height = `${h}px`;
  }

  /**
   * Gives the position of the mouse relative to the graph, adjusted for zoom.
   * @returns An object with the mouse's X and Y positions
   */
  public getMousePos(): {x: number; y: number} {
    return this.stageManager.getMousePos();
  }

  /**
   * Gives the selection manager of this graph.
   * @returns The selection manager
   */
  public getSelectionManager() {
    return this.selectionManager;
  }

  /**
   * Applies the given commands to the graph.
   * @param commands - An array of graph change commands
   */
  public applyCommands(commands: GraphManagerCommand[]): void {
    for (const command of commands) {
      if (command.type === "addVertex") {
        this.addVertex(command.vertexKey, command.vertexData);
      } else if (command.type === "addEdge") {
        this.addEdge(command.edgeKey, command.edgeData);
      } else if (command.type === "updateVertex") {
        this.updateVertex(command.vertexKey, command.vertexData);
      } else if (command.type === "removeEdge") {
        this.removeEdge(command.edgeKey, command.edgeData);
      } else if (command.type === "removeVertex") {
        this.removeVertex(command.vertexKey);
      }
    }

    // after changes have been made, edges may need to be moved
    for (const edgeKey of Object.keys(this.edgeWrappers)) {
      this.edgeWrappers[edgeKey].refresh();
    }
  }

  /**
   * Adds a vertex to the graph.
   * @param vertexKey - The key of the vertex
   * @param vertexData - The vertex data
   */
  private addVertex(vertexKey: string, vertexData: IVertexData) {
    if (this.vertexWrappers[vertexKey] !== undefined) {
      throw new Error(`A vertex with the key ${vertexKey} is already present`);
    }

    const vertexWrapper = new VertexWrapper(this.stageManager.getStageInterface());
    const editIcon = new EditIconWrapper(this.stageManager.getStageInterface());
    vertexWrapper.addEditIcon(editIcon);

    this.dragRegistry.registerEditIcon(
      editIcon,
      () => {
        editIcon.toggleClicking(true);
      },
      () => {
        editIcon.toggleClicking(false);
        setTimeout(() => {
          this.dialogs.editLayerDialog(vertexKey);
        });
      },
    );

    this.vertexWrappers[vertexKey] = vertexWrapper;
    this.ports[vertexKey] = {};
    this.portEdges[vertexKey] = {};

    this.stageManager.addVertex(vertexWrapper);
    this.dragRegistry.registerVertex(vertexKey, vertexWrapper);
    this.cullingManager.registerVertex(vertexKey, vertexWrapper);

    this.updateVertex(vertexKey, vertexData);
  }

  /**
   * Adds an edge to the graph
   * @param edgeKey - The key of the edge
   * @param edgeData - The edge data
   */
  private addEdge(edgeKey: string, edgeData: IEdgeData) {
    if (this.edgeWrappers[edgeKey] !== undefined) {
      throw new Error(`An edge with the key ${edgeKey} is already present`);
    }

    const edgeWrapper = new EdgeWrapper(
      this.vertexWrappers[edgeData.sourceVertexId],
      this.ports[edgeData.sourceVertexId][edgeData.sourcePortId],
      this.vertexWrappers[edgeData.targetVertexId],
      this.ports[edgeData.targetVertexId][edgeData.targetPortId],
      edgeData.consistency,
    );

    this.edgeWrappers[edgeKey] = edgeWrapper;

    this.portEdges[edgeData.sourceVertexId][edgeData.sourcePortId].push(edgeKey);
    this.portEdges[edgeData.targetVertexId][edgeData.targetPortId].push(edgeKey);

    this.stageManager.addEdge(edgeWrapper);
    this.dragRegistry.registerEdge(edgeKey, edgeWrapper);
    this.cullingManager.registerEdge(edgeKey, edgeWrapper);
  }

  /**
   * Removes the vertex with the given key from the graph.
   * @param vertexKey - The vertex key
   */
  private removeVertex(vertexKey: string) {
    if (this.vertexWrappers[vertexKey] === undefined) {
      throw new Error(`No vertex with key ${vertexKey} is present`);
    }

    const vertexWrapper = this.vertexWrappers[vertexKey];

    this.stageManager.removeVertex(vertexWrapper);
    this.dragRegistry.removeVertex(vertexKey);
    for (const portKey in this.ports[vertexKey])
    {
      this.dragRegistry.removePort(vertexKey, portKey);
    }
    this.cullingManager.removeVertex(vertexKey);
    this.portPreviewManager.removeVertex(vertexKey);

    delete this.vertexWrappers[vertexKey];
    delete this.ports[vertexKey];
  }

  /**
   * Removes the edge with the given key and data from the graph.
   * @param edgeKey - The edge key
   * @param edgeData - The data of the edge
   */
  private removeEdge(edgeKey: string, edgeData: IEdgeData) {
    if (this.edgeWrappers[edgeKey] === undefined) {
      throw new Error(`No edge with key ${edgeKey} is present`);
    }

    const edgeWrapper = this.edgeWrappers[edgeKey];

    delete this.edgeWrappers[edgeKey];
    this.stageManager.removeEdge(edgeWrapper);
    this.dragRegistry.removeEdge(edgeKey, edgeWrapper);
    this.cullingManager.removeEdge(edgeKey);

    const srcIdx = this.portEdges[edgeData.sourceVertexId][edgeData.sourcePortId].indexOf(edgeKey);
    this.portEdges[edgeData.sourceVertexId][edgeData.sourcePortId].splice(srcIdx, 1);
    const tgtIdx = this.portEdges[edgeData.targetVertexId][edgeData.targetPortId].indexOf(edgeKey);
    this.portEdges[edgeData.targetVertexId][edgeData.targetPortId].splice(tgtIdx, 1);
  }

  /**
   * Updates a vertex that already exists in the graph.
   * @param vertexId - The vertex id
   * @param vertexData - The new vertex data
   */
  private updateVertex(vertexId: string, vertexData: IVertexData) {
    const vertexWrapper = this.vertexWrappers[vertexId];

    vertexWrapper.setLocalPosition(vertexData.geo.x, vertexData.geo.y);
    vertexWrapper.setLabelText(vertexData.label);

    const removedPortIds = new Set(Object.keys(this.ports[vertexId]));
    const addedPortIds = new Set(Object.keys(vertexData.ports));
    const sharedPortIds = new Set<string>();

    for (const portId of removedPortIds) {
      if (addedPortIds.has(portId)) {
        removedPortIds.delete(portId);
        addedPortIds.delete(portId);
        sharedPortIds.add(portId);
      }
    }

    for (const removedPortId of removedPortIds) {
      const port = this.ports[vertexId][removedPortId];
      vertexWrapper.removeChild(port.getDisplayObject());
      delete this.ports[vertexId][removedPortId];
      delete this.portEdges[vertexId][removedPortId];
      this.portPreviewManager.removePort(removedPortId, vertexId);
      this.dragRegistry.removePort(vertexId, removedPortId);
    }
    for (const addedPortId of addedPortIds) {
      const portData = vertexData.ports[addedPortId];
      const portWrapper = new PortWrapper(this.stageManager.getStageInterface(), portData.portType === "output");
      vertexWrapper.addChild(portWrapper.getDisplayObject());
      vertexWrapper.positionPort(portWrapper, portData.position, portData.side);

      this.ports[vertexId][addedPortId] = portWrapper;
      this.portEdges[vertexId][addedPortId] = [];
      this.dragRegistry.registerPort(vertexId, vertexWrapper, addedPortId, portWrapper);
    }
    for (const sharedPortId of sharedPortIds) {
      const portData = vertexData.ports[sharedPortId];
      const portWrapper = this.ports[vertexId][sharedPortId];

      vertexWrapper.positionPort(portWrapper, portData.position, portData.side);
    }

    this.cullingManager.updateVertex(vertexId);
  }
}
