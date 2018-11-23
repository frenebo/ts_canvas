import { EdgeWrapper } from "./edgeWrapper.js";
import { VertexWrapper } from "./vertexWrapper.js";
import { VertexData, EdgeData, ModelVersioningRequest, ModelInfoRequestType, ModelChangeRequest, ModelInfoRequestMap, ModelInfoResponseMap } from "../../interfaces.js";
import { EditIcon } from "./icons/editIcon.js";
import { PortWrapper } from "./portWrapper.js";
import { StageManager } from "./stageManager.js";
import { DragRegistry } from "./dragAndSelection/dragRegistry.js";

export type GraphManagerCommand = {
  type: "removeEdge",
  edgeKey: string,
  edgeData: EdgeData,
} | {
  type: "removeVertex",
  vertexKey: string,
} | {
  type: "addVertex",
  vertexKey: string,
  vertexData: VertexData,
} | {
  type: "addEdge",
  edgeKey: string,
  edgeData: EdgeData,
} | {
  type: "updateVertex",
  vertexKey: string,
  vertexData: VertexData,
};

export class GraphManager {
  private vertexWrappers: {
    [vertexKey: string]: VertexWrapper;
  } = {};
  private ports: {
    [vertexKey: string]: {
      [portKey: string]: PortWrapper;
    }
  } = {};
  private portEdges: {
    [vertexKey: string]: {
      [portKey: string]: string[]; // edge ids
    }
  } = {};
  private edgeWrappers: {
    [edgeKey: string]: EdgeWrapper;
  } = {};

  private stageManager: StageManager;
  private dragRegistry: DragRegistry;

  constructor(
    div: HTMLDivElement,
    sendModelChangeRequest: (req: ModelChangeRequest) => void,
    sendModelInfoRequest: <T extends ModelInfoRequestType>(req: ModelInfoRequestMap[T]) => ModelInfoResponseMap[T],
    sendModelVersioningRequest: (req: ModelVersioningRequest) => void,
  ) {
    this.stageManager = new StageManager(div);
    this.dragRegistry = new DragRegistry(
      sendModelChangeRequest,
      sendModelInfoRequest,
      sendModelVersioningRequest,
      () => this.vertexWrappers,
      () => this.edgeWrappers,
      this.stageManager.getBackgroundWrapper(),
      this.stageManager.getRenderer(),
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
    if (this.vertexWrappers[vertexKey] !== undefined) throw new Error(`A vertex with the key ${vertexKey} is already present`);

    const vertexWrapper = new VertexWrapper(this.stageManager.getRenderer());
    vertexWrapper.addEditIcon(new EditIcon(this.stageManager.getRenderer()));

    this.stageManager.addVertex(vertexWrapper);

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
  }

  private removeVertex(vertexKey: string) {
    if (this.vertexWrappers[vertexKey] === undefined) throw new Error(`No vertex with key ${vertexKey} is present`);

    const vertexWrapper = this.vertexWrappers[vertexKey];
    delete this.vertexWrappers[vertexKey];
    delete this.ports[vertexKey];

    this.stageManager.removeVertex(vertexWrapper);
  }

  private removeEdge(edgeKey: string, edgeData: EdgeData) {
    if (this.edgeWrappers[edgeKey] === undefined) throw new Error(`No edge with key ${edgeKey} is present`);

    const edgeWrapper = this.edgeWrappers[edgeKey];

    delete this.edgeWrappers[edgeKey];
    this.stageManager.removeEdge(edgeWrapper);
    this.portEdges[edgeData.sourceVertexId][edgeData.sourcePortId].splice(this.portEdges[edgeData.sourceVertexId][edgeData.sourcePortId].indexOf(edgeKey), 1);
    this.portEdges[edgeData.targetVertexId][edgeData.targetPortId].splice(this.portEdges[edgeData.targetVertexId][edgeData.targetPortId].indexOf(edgeKey), 1);
  }

  private updateVertex(vertexKey: string, vertexData: VertexData) {
    const vertexWrapper = this.vertexWrappers[vertexKey];

    vertexWrapper.setPosition(vertexData.geo.x, vertexData.geo.y);
    vertexWrapper.setLabelText(vertexData.label);

    const beforePorts = Object.keys(this.ports[vertexKey]);
    const afterPorts = Object.keys(vertexData.ports);

    const removedPortIds = beforePorts.filter(k => afterPorts.indexOf(k) === -1);
    const addedPortIds = afterPorts.filter(k => beforePorts.indexOf(k) === -1);
    const sharedPortIds = beforePorts.filter(k => afterPorts.indexOf(k) !== -1);

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
    }
    for (const sharedPortId of sharedPortIds) {
      const portData = vertexData.ports[sharedPortId];
      const portWrapper = this.ports[vertexKey][sharedPortId];;

      vertexWrapper.positionPort(portWrapper, portData.position, portData.side);
    }
  }
}
