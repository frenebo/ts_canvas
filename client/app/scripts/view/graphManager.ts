
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
      () => this.vertexWrappers,
      () => this.edgeWrappers,
      () => this.ports,
      this.selectionManager,
      this.portPreviewManager,
      this.stageManager.getStageInterface(),
    );

    this.cullingManager = new CullingManager(
      this.stageManager.getStageInterface(),
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
    for (const edgeKey of Object.keys(this.edgeWrappers)) {
      this.edgeWrappers[edgeKey].refresh();
    }
  }

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

  private removeVertex(vertexKey: string) {
    if (this.vertexWrappers[vertexKey] === undefined) {
      throw new Error(`No vertex with key ${vertexKey} is present`);
    }

    const vertexWrapper = this.vertexWrappers[vertexKey];
    delete this.vertexWrappers[vertexKey];
    delete this.ports[vertexKey];

    this.stageManager.removeVertex(vertexWrapper);
    this.dragRegistry.removeVertex(vertexKey, vertexWrapper);
    this.cullingManager.removeVertex(vertexKey);
    this.portPreviewManager.removeVertex(vertexKey);
  }

  private removeEdge(edgeKey: string, edgeData: IEdgeData) {
    if (this.edgeWrappers[edgeKey] === undefined) {
      throw new Error(`No edge with key ${edgeKey} is present`);
    }

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

  private updateVertex(vertexId: string, vertexData: IVertexData) {
    const vertexWrapper = this.vertexWrappers[vertexId];

    vertexWrapper.setPosition(vertexData.geo.x, vertexData.geo.y);
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