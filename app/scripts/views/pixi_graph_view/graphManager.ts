import { EdgeWrapper } from "./edgeWrapper.js";
import { VertexWrapper } from "./vertexWrapper.js";
import {
  VertexData, EdgeData, ModelVersioningRequest, ModelInfoRequestType, ModelChangeRequest, ModelInfoRequestMap,
  ModelInfoResponseMap,
} from "../../interfaces.js";
import { EditIcon } from "./icons/editIcon.js";
import { PortWrapper } from "./portWrapper.js";
import { StageManager } from "./stageManager.js";
import { DragRegistry } from "./dragAndSelection/dragRegistry.js";
import { SelectionManager } from "./selectionManager.js";
import { KeyboardHandler } from "./keyboardHandler.js";

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

  constructor(
    div: HTMLDivElement,
    sendModelChangeRequest: (req: ModelChangeRequest) => void,
    sendModelInfoRequest: <T extends ModelInfoRequestType>(req: ModelInfoRequestMap[T]) => ModelInfoResponseMap[T],
    sendModelVersioningRequest: (req: ModelVersioningRequest) => void,
  ) {
    this.stageManager = new StageManager(div);
    this.selectionManager = new SelectionManager(
      () => this.vertexWrappers,
      () => this.edgeWrappers,
      sendModelChangeRequest,
      sendModelInfoRequest,
      this.stageManager.getRenderer(),
      this.stageManager.getBackgroundWrapper(),
    );
    this.dragRegistry = new DragRegistry(
      sendModelChangeRequest,
      sendModelInfoRequest,
      sendModelVersioningRequest,
      () => this.vertexWrappers,
      () => this.edgeWrappers,
      () => this.ports,
      this.stageManager.getBackgroundWrapper(),
      this.selectionManager,
      this.stageManager.getRenderer(),
    );

    new KeyboardHandler(
      this.stageManager.getRenderer(),
      this.selectionManager,
      sendModelChangeRequest,
      sendModelVersioningRequest,
    );
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
    const editIcon = new EditIcon(this.stageManager.getRenderer());
    vertexWrapper.addEditIcon(editIcon);

    this.dragRegistry.registerEditIcon(
      editIcon,
      () => {
        editIcon.toggleSelected(true);
        console.log("edit icon click");
      },
      () => {
        editIcon.toggleSelected(false);
        // empty
      },
    );

    this.stageManager.addVertex(vertexWrapper);
    this.dragRegistry.registerVertex(vertexKey, vertexWrapper);

    this.vertexWrappers[vertexKey] = vertexWrapper;
    this.ports[vertexKey] = {};
    this.portEdges[vertexKey] = {};

    this.updateVertex(vertexKey, vertexData);
  }

  private addEdge(edgeKey: string, edgeData: EdgeData) {
    if (this.edgeWrappers[edgeKey] !== undefined) throw new Error(`An edge with the key ${edgeKey} is already present`);

    const edgeWrapper = new EdgeWrapper(
      this.vertexWrappers[edgeData.sourceVertexId],
      this.ports[edgeData.sourceVertexId][edgeData.sourcePortId],
      this.vertexWrappers[edgeData.targetVertexId],
      this.ports[edgeData.targetVertexId][edgeData.targetPortId],
    );

    this.edgeWrappers[edgeKey] = edgeWrapper;

    this.portEdges[edgeData.sourceVertexId][edgeData.sourcePortId].push(edgeKey);
    this.portEdges[edgeData.targetVertexId][edgeData.targetPortId].push(edgeKey);

    this.stageManager.addEdge(edgeWrapper);
    this.dragRegistry.registerEdge(edgeKey, edgeWrapper);
  }

  private removeVertex(vertexKey: string) {
    if (this.vertexWrappers[vertexKey] === undefined) throw new Error(`No vertex with key ${vertexKey} is present`);

    const vertexWrapper = this.vertexWrappers[vertexKey];
    delete this.vertexWrappers[vertexKey];
    delete this.ports[vertexKey];

    this.stageManager.removeVertex(vertexWrapper);
    this.dragRegistry.removeVertex(vertexKey, vertexWrapper);
  }

  private removeEdge(edgeKey: string, edgeData: EdgeData) {
    if (this.edgeWrappers[edgeKey] === undefined) throw new Error(`No edge with key ${edgeKey} is present`);

    const edgeWrapper = this.edgeWrappers[edgeKey];

    delete this.edgeWrappers[edgeKey];
    this.stageManager.removeEdge(edgeWrapper);
    this.dragRegistry.removeEdge(edgeKey, edgeWrapper);
    const srcIdx = this.portEdges[edgeData.sourceVertexId][edgeData.sourcePortId].indexOf(edgeKey);
    this.portEdges[edgeData.sourceVertexId][edgeData.sourcePortId].splice(srcIdx, 1);
    const tgtIdx = this.portEdges[edgeData.targetVertexId][edgeData.targetPortId].indexOf(edgeKey);
    this.portEdges[edgeData.targetVertexId][edgeData.targetPortId].splice(tgtIdx, 1);
  }

  private updateVertex(vertexKey: string, vertexData: VertexData) {
    const vertexWrapper = this.vertexWrappers[vertexKey];

    vertexWrapper.setPosition(vertexData.geo.x, vertexData.geo.y);
    vertexWrapper.setLabelText(vertexData.label);

    const beforePorts = Object.keys(this.ports[vertexKey]);
    const afterPorts = Object.keys(vertexData.ports);

    const removedPortIds = beforePorts.filter((k) => afterPorts.indexOf(k) === -1);
    const addedPortIds = afterPorts.filter((k) => beforePorts.indexOf(k) === -1);
    const sharedPortIds = beforePorts.filter((k) => afterPorts.indexOf(k) !== -1);

    for (const removedPortId of removedPortIds) {
      const port = this.ports[vertexKey][removedPortId];
      vertexWrapper.removeChild(port.getDisplayObject());
      delete this.ports[vertexKey][removedPortId];
      delete this.portEdges[vertexKey][removedPortId];
    }
    for (const addedPortId of addedPortIds) {
      const portData = vertexData.ports[addedPortId];
      const portWrapper = new PortWrapper(this.stageManager.getRenderer(), portData.portType === "output");
      vertexWrapper.addChild(portWrapper.getDisplayObject());
      vertexWrapper.positionPort(portWrapper, portData.position, portData.side);

      this.ports[vertexKey][addedPortId] = portWrapper;
      this.portEdges[vertexKey][addedPortId] = [];
      this.dragRegistry.registerPort(vertexKey, vertexWrapper, addedPortId, portWrapper);
    }
    for (const sharedPortId of sharedPortIds) {
      const portData = vertexData.ports[sharedPortId];
      const portWrapper = this.ports[vertexKey][sharedPortId];

      vertexWrapper.positionPort(portWrapper, portData.position, portData.side);
    }
  }
}