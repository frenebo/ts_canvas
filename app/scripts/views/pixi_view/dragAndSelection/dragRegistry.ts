import { BackgroundWrapper } from "../backgroundWrapper.js";
import { BackgroundDragHandler } from "./backgroundDragHandler.js";
import { EdgeWrapper } from "../edgeWrapper.js";
import { VertexWrapper } from "../vertexWrapper.js";
import { VertexDragHandler } from "./vertexDragHandler.js";
import { MenuBar } from "../menuBar.js";
import { PortWrapper } from "../portWrapper.js";
import {
  ModelChangeRequest, ModelInfoResponseMap, ModelInfoRequestType, ModelInfoRequestMap, ModelVersioningRequest,
} from "../../../interfaces.js";
import { PortDragHandler } from "./portDragHandler.js";
import { EdgeDrawHandler } from "./edgeDrawHandler.js";
import { EditIcon } from "../icons/editIcon.js";
import { SelectionManager } from "./selectionManager.js";
import { KeyboardHandler } from "./keyboardHandler.js";
import { EdgeDragHandler } from "./edgeDragHandler.js";

export type DragListener = (ev: PIXI.interaction.InteractionEvent) => unknown;

export interface DragListeners {
  onDragStart(listener: DragListener): void;
  onDragMove(listener: DragListener): void;
  onDragEnd(listener: DragListener): void;
  onDragAbort(listener: () => void): void;
}

export class DragRegistry {
  private static readonly portSnapDistance = 20;

  private currentObject: PIXI.DisplayObject | null;
  private readonly edgeDrawHandler: EdgeDrawHandler;
  private readonly selectionManager: SelectionManager;

  private readonly edgeDragAbortListeners: {[key: string]: Array<() => void>} = {};
  private readonly vertexDragAbortListeners: {[key: string]: Array<() => void>} = {};

  constructor(
    private readonly sendModelChangeRequests: (...reqs: ModelChangeRequest[]) => void,
    private readonly sendModelInfoRequest: <T extends ModelInfoRequestType>(
      req: ModelInfoRequestMap[T],
    ) => ModelInfoResponseMap[T],
    sendModelVersioningRequest: (req: ModelVersioningRequest) => void,
    private readonly getVertexWrappers: () => Readonly<{[key: string]: VertexWrapper}>,
    private readonly getEdgeWrappers: () => Readonly<{[key: string]: EdgeWrapper}>,
    private readonly backgroundWrapper: BackgroundWrapper,
    renderer: PIXI.WebGLRenderer | PIXI.CanvasRenderer,
  ) {
    this.currentObject = null;
    this.edgeDrawHandler = new EdgeDrawHandler(this.backgroundWrapper);
    this.selectionManager = new SelectionManager(
      getVertexWrappers,
      getEdgeWrappers,
      sendModelChangeRequests,
      sendModelInfoRequest,
      renderer,
      backgroundWrapper,
    );
    this.registerBackground(this.backgroundWrapper);

    new KeyboardHandler(
      renderer,
      this.selectionManager,
      sendModelChangeRequests,
      sendModelVersioningRequest,
    );
  }

  private portsByCloseness(targetX: number, targetY: number): Array<{
    portKey: string;
    port: PortWrapper;
    vtxKey: string;
    vtx: VertexWrapper;
    distanceSquared: number;
  }> {
    const portDescriptions: Array<{
      portKey: string;
      port: PortWrapper;
      vtxKey: string;
      vtx: VertexWrapper;
      distanceSquared: number;
    }> = [];

    for (const vertexKey in this.getVertexWrappers()) {
      const vertexWrapper = this.getVertexWrappers()[vertexKey];
      for (const portKey of vertexWrapper.portKeys()) {
        const portWrapper = vertexWrapper.getPortWrapper(portKey);
        const xDistance = targetX - (portWrapper.localX() + vertexWrapper.localX() + portWrapper.getWidth()/2);
        const yDistance = targetY - (portWrapper.localY() + vertexWrapper.localY() + portWrapper.getHeight()/2);
        portDescriptions.push({
          portKey: portKey,
          port: portWrapper,
          vtxKey: vertexKey,
          vtx: vertexWrapper,
          distanceSquared: xDistance*xDistance + yDistance*yDistance,
        });
      }
    }

    const sortedDescriptions = portDescriptions.sort((d1, d2) => d1.distanceSquared - d2.distanceSquared);

    return sortedDescriptions;
  }

  private uniqueEdgeId(): string {
    let i = 0;
    while (true) {
      const id = `edge${i.toString()}`;

      i++;

      if (this.getEdgeWrappers()[id] === undefined) return id;
    }
  }

  public registerMenuBar(menuBar: MenuBar): void {
    this.registerDisplayObject(menuBar.getDisplayObject());
  }

  private registerBackground(background: BackgroundWrapper): void {
    const listeners = this.registerDisplayObject(background.getDisplayObject());
    new BackgroundDragHandler(this.selectionManager, background, listeners);
  }

  public registerVertex(id: string, vertex: VertexWrapper): void {
    this.vertexDragAbortListeners[id] = [];
    const listeners = this.registerDisplayObject(
      vertex.getDisplayObject(),
      (l) => this.vertexDragAbortListeners[id].push(l),
    );
    new VertexDragHandler(id, vertex, listeners, this.selectionManager);
  }

  public removeVertex(id: string, vertex: VertexWrapper): void {
    this.selectionManager.removeDeletedVertex(id, vertex);

    if (this.currentObject === vertex.getDisplayObject()) {
      this.currentObject = null;

      for (const l of this.vertexDragAbortListeners[id]) l();
    }

    delete this.vertexDragAbortListeners[id];
  }

  public registerEdge(id: string, edge: EdgeWrapper): void {
    this.edgeDragAbortListeners[id] = [];
    const listeners = this.registerDisplayObject(
      edge.getDisplayObject(),
      (l) => this.edgeDragAbortListeners[id].push(l),
    );

    new EdgeDragHandler(id, edge, listeners, this.selectionManager);
  }

  public removeEdge(id: string, edge: EdgeWrapper): void {
    this.selectionManager.removeDeletedEdge(id, edge);

    if (this.currentObject === edge.getDisplayObject()) {
      this.currentObject = null;

      for (const l of this.edgeDragAbortListeners[id]) l();
    }

    delete this.edgeDragAbortListeners[id];
  }

  public registerEditIcon(editIcon: EditIcon, clickBegin: () => void, clickEnd: () => void): void {
    const listeners = this.registerDisplayObject(editIcon.getDisplayObject());
    listeners.onDragStart(clickBegin);
    listeners.onDragEnd(clickEnd);
  }

  public registerPort(vertexId: string, vtxWrapper: VertexWrapper, portId: string, port: PortWrapper): void {
    const listeners = this.registerDisplayObject(port.getDisplayObject());
    const portDragHandler = new PortDragHandler(port, listeners);

    portDragHandler.onPortDragStart(() => {
      this.edgeDrawHandler.beginDraw(vtxWrapper, port);
    });

    const getSnapPortInfo = (cursorLocalX: number, cursorLocalY: number) => {
      const closestInfo = this.portsByCloseness(cursorLocalX, cursorLocalY)[0];

      const closestPortVertex = closestInfo.vtx;
      const closestPort = closestInfo.port;

      if (
        (closestPortVertex !== vtxWrapper || closestPort !== port) &&
        closestInfo.distanceSquared < DragRegistry.portSnapDistance*DragRegistry.portSnapDistance
      ) {
        const edgeValidityInfo = this.sendModelInfoRequest<"validateEdge">({
          type: "validateEdge",
          sourceVertexId: vertexId,
          sourcePortId: portId,
          targetVertexId: closestInfo.vtxKey,
          targetPortId: closestInfo.portKey,
        });

        return {
          targetVtx: closestPortVertex,
          targetPort: closestPort,
          targetVtxId: closestInfo.vtxKey,
          targetPortId: closestInfo.portKey,
          xPos: closestPort.localX() + closestPort.getWidth()/2 + closestPortVertex.localX(),
          yPos: closestPort.localY() + closestPort.getWidth()/2 + closestPortVertex.localY(),
          isValid: edgeValidityInfo.validity === "valid",
        };
      } else {
        return null;
      }
    };

    portDragHandler.onPortDragMove((cursorX, cursorY) => {
      const cursorLocalX = (cursorX - this.backgroundWrapper.localX())/this.backgroundWrapper.localScale();
      const cursorLocalY = (cursorY - this.backgroundWrapper.localY())/this.backgroundWrapper.localScale();
      const snapPortInfo = getSnapPortInfo(cursorLocalX, cursorLocalY);

      // snap to closest port
      if (snapPortInfo !== null) {
        this.edgeDrawHandler.redrawLine(
          snapPortInfo.xPos,
          snapPortInfo.yPos,
          snapPortInfo.isValid ? "valid" : "invalid",
        );
      } else {
        this.edgeDrawHandler.redrawLine(cursorLocalX, cursorLocalY);
      }
    });
    portDragHandler.onPortDragEnd((cursorX, cursorY) => {
      this.edgeDrawHandler.endDrag();

      const cursorLocalX = (cursorX - this.backgroundWrapper.localX())/this.backgroundWrapper.localScale();
      const cursorLocalY = (cursorY - this.backgroundWrapper.localY())/this.backgroundWrapper.localScale();

      const snapPortInfo = getSnapPortInfo(cursorLocalX, cursorLocalY);

      if (snapPortInfo !== null && snapPortInfo.isValid) {
        this.sendModelChangeRequests({
          newEdgeId: this.uniqueEdgeId(),
          type: "createEdge",
          sourceVertexId: vertexId,
          sourcePortId: portId,
          targetVertexId: snapPortInfo.targetVtxId,
          targetPortId: snapPortInfo.targetPortId,
        });
      }
    });
    portDragHandler.onPortDragAbort(() => {
      this.edgeDrawHandler.endDrag();
    });
  }

  private registerDisplayObject(obj: PIXI.DisplayObject, setAbortListener?: (l: () => void) => void) {

    const dragStartListeners: DragListener[] = [];
    const dragMoveListeners: DragListener[] = [];
    const dragEndListeners: DragListener[] = [];
    const dragAbortListeners: Array<() => void> = [];

    let dragging = false;

    const onDragStart = (ev: PIXI.interaction.InteractionEvent) => {
      if (this.currentObject !== null) return;

      this.currentObject = obj;
      dragging = true;

      for (const listener of dragStartListeners) listener(ev);
    };

    const onDragMove = (ev: PIXI.interaction.InteractionEvent) => {
      if (!dragging) return;

      for (const listener of dragMoveListeners) listener(ev);
    };

    const onDragEnd = (ev: PIXI.interaction.InteractionEvent) => {
      if (!dragging) return;

      dragging = false;
      this.currentObject = null;

      for (const listener of dragEndListeners) listener(ev);
    };

    const callAbortListeners = () => {
      for (const listener of dragAbortListeners) listener();
    };

    if (setAbortListener !== undefined) setAbortListener(callAbortListeners);

    obj
      .on("mousedown",       onDragStart)
      .on("touchstart",      onDragStart)
      .on("mouseup",         onDragEnd)
      .on("mouseupoutside",  onDragEnd)
      .on("touchend",        onDragEnd)
      .on("touchendoutside", onDragEnd)
      .on("mousemove",       onDragMove)
      .on("touchmove",       onDragMove);

    return {
      onDragStart: (listener: DragListener) => { dragStartListeners.push(listener); },
      onDragMove: (listener: DragListener) => { dragMoveListeners.push(listener); },
      onDragEnd: (listener: DragListener) => { dragEndListeners.push(listener); },
      onDragAbort: (listener: () => void) => { dragAbortListeners.push(listener); },
    };
  }
}
