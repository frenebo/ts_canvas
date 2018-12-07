import { EdgeWrapper } from "./graphicWrappers/edgeWrapper.js";
import { VertexWrapper } from "./graphicWrappers/vertexWrapper.js";
import {
  VertexData,
  EdgeData,
} from "../../interfaces.js";
import { EditIconWrapper } from "./graphicWrappers/editIconWrapper.js";
import { PortWrapper } from "./graphicWrappers/portWrapper.js";
import { StageManager } from "./stageManager.js";
import { DragRegistry } from "./dragAndSelection/dragRegistry.js";
import { SelectionManager } from "./selectionManager.js";
import { CullingManager } from "./cullingManager.js";
import { PortPreviewManager } from "./portPreviewManager.js";
import { DialogManager } from "./dialogs/dialogManager.js";
import { RequestModelChangesFunc, RequestInfoFunc } from "../../messenger.js";

export type GraphManagerCommand = {
  type: "removeEdge";
  edgeKey: string;
  edgeData: EdgeData;
} | {
  type: "removeVertex";
  vertexKey: string;
} | {
  type: "addVertex";
  vertexKey: string;
  vertexData: VertexData;
} | {
  type: "addEdge";
  edgeKey: string;
  edgeData: EdgeData;
} | {
  type: "updateVertex";
  vertexKey: string;
  vertexData: VertexData;
};

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

  constructor(
    private readonly div: HTMLDivElement,
    private readonly dialogs: DialogManager,
    private readonly sendModelChangeRequests: RequestModelChangesFunc,
    private readonly sendModelInfoRequests: RequestInfoFunc,
  ) {
    this.stageManager = new StageManager(div);
    this.selectionManager = new SelectionManager(
      () => this.vertexWrappers,
      () => this.edgeWrappers,
      sendModelChangeRequests,
      sendModelInfoRequests,
      this.stageManager.getRenderer(),
      this.stageManager.getBackgroundWrapper(),
    );

    this.portPreviewManager = new PortPreviewManager(
      this.stageManager.getBackgroundWrapper(),
      sendModelInfoRequests,
    );

    this.dragRegistry = new DragRegistry(
      sendModelChangeRequests,
      sendModelInfoRequests,
      () => this.vertexWrappers,
      () => this.edgeWrappers,
      () => this.ports,
      this.stageManager.getBackgroundWrapper(),
      this.selectionManager,
      this.portPreviewManager,
      this.stageManager.getRenderer(),
    );

    this.cullingManager = new CullingManager(
      this.stageManager.getBackgroundWrapper(),
      this.stageManager.getRenderer(),
    );
  }

  public setDimensions(w: number, h: number): void {
    this.stageManager.setDimensions(w, h);
    this.div.style.width = `${w}px`;
    this.div.style.height = `${h}px`;
  }

  public getSelectionManager() {
    return this.selectionManager;
  }

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
    for (const edgeKey in this.edgeWrappers) {
      this.edgeWrappers[edgeKey].refresh();
    }
  }

  private addVertex(vertexKey: string, vertexData: VertexData) {
    if (this.vertexWrappers[vertexKey] !== undefined) {
      throw new Error(`A vertex with the key ${vertexKey} is already present`);
    }

    const vertexWrapper = new VertexWrapper(this.stageManager.getRenderer());
    const editIcon = new EditIconWrapper(this.stageManager.getRenderer());
    vertexWrapper.addEditIcon(editIcon);

    this.dragRegistry.registerEditIcon(
      editIcon,
      () => {
        editIcon.toggleSelected(true);
      },
      () => {
        editIcon.toggleSelected(false);
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

  private addEdge(edgeKey: string, edgeData: EdgeData) {
    if (this.edgeWrappers[edgeKey] !== undefined) throw new Error(`An edge with the key ${edgeKey} is already present`);

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

  private removeVertex(vertexKey: string) {
    if (this.vertexWrappers[vertexKey] === undefined) throw new Error(`No vertex with key ${vertexKey} is present`);

    const vertexWrapper = this.vertexWrappers[vertexKey];
    delete this.vertexWrappers[vertexKey];
    delete this.ports[vertexKey];

    this.stageManager.removeVertex(vertexWrapper);
    this.dragRegistry.removeVertex(vertexKey, vertexWrapper);
    this.cullingManager.removeVertex(vertexKey);
    this.portPreviewManager.removeVertex(vertexKey);
  }

  private removeEdge(edgeKey: string, edgeData: EdgeData) {
    if (this.edgeWrappers[edgeKey] === undefined) throw new Error(`No edge with key ${edgeKey} is present`);

    const edgeWrapper = this.edgeWrappers[edgeKey];

    delete this.edgeWrappers[edgeKey];
    this.stageManager.removeEdge(edgeWrapper);
    this.dragRegistry.removeEdge(edgeKey, edgeWrapper);
    this.cullingManager.removeEdge(edgeKey, edgeWrapper);

    const srcIdx = this.portEdges[edgeData.sourceVertexId][edgeData.sourcePortId].indexOf(edgeKey);
    this.portEdges[edgeData.sourceVertexId][edgeData.sourcePortId].splice(srcIdx, 1);
    const tgtIdx = this.portEdges[edgeData.targetVertexId][edgeData.targetPortId].indexOf(edgeKey);
    this.portEdges[edgeData.targetVertexId][edgeData.targetPortId].splice(tgtIdx, 1);
  }

  private updateVertex(vertexId: string, vertexData: VertexData) {
    const vertexWrapper = this.vertexWrappers[vertexId];

    vertexWrapper.setPosition(vertexData.geo.x, vertexData.geo.y);
    vertexWrapper.setLabelText(vertexData.label);

    const beforePorts = Object.keys(this.ports[vertexId]);
    const afterPorts = Object.keys(vertexData.ports);

    const removedPortIds = beforePorts.filter((k) => afterPorts.indexOf(k) === -1);
    const addedPortIds = afterPorts.filter((k) => beforePorts.indexOf(k) === -1);
    const sharedPortIds = beforePorts.filter((k) => afterPorts.indexOf(k) !== -1);

    for (const removedPortId of removedPortIds) {
      const port = this.ports[vertexId][removedPortId];
      vertexWrapper.removeChild(port.getDisplayObject());
      delete this.ports[vertexId][removedPortId];
      delete this.portEdges[vertexId][removedPortId];
      this.portPreviewManager.removePort(removedPortId, vertexId);
    }
    for (const addedPortId of addedPortIds) {
      const portData = vertexData.ports[addedPortId];
      const portWrapper = new PortWrapper(this.stageManager.getRenderer(), portData.portType === "output");
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
