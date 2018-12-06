import { BackgroundWrapper } from "../backgroundWrapper.js";
import { BackgroundDragHandler } from "./backgroundDragHandler.js";
import { EdgeWrapper } from "../graphicWrappers/edgeWrapper.js";
import { VertexWrapper } from "../graphicWrappers/vertexWrapper.js";
import { VertexDragHandler } from "./vertexDragHandler.js";
import { PortWrapper } from "../graphicWrappers/portWrapper.js";
import {
  ModelChangeRequest, ModelInfoResponseMap, ModelInfoRequestType, ModelInfoRequestMap, ModelVersioningRequest,
} from "../../../interfaces.js";
import { PortDragHandler } from "./portDragHandler.js";
import { EdgeDrawHandler } from "./edgeDrawHandler.js";
import { EditIconWrapper } from "../graphicWrappers/editIconWrapper.js";
import { SelectionManager } from "../selectionManager.js";
import { EdgeDragHandler } from "./edgeDragHandler.js";
import { PortPreviewManager } from "../portPreviewManager.js";

export type DragListener = (ev: PIXI.interaction.InteractionEvent) => unknown;

export interface DragListeners {
  onDragStart(listener: DragListener): void;
  onDragMove(listener: DragListener): void;
  onDragEnd(listener: DragListener): void;
  onDragAbort(listener: () => void): void;
}

export class DragRegistry {
  private static readonly portTargetHoverWait = 250;
  private static readonly portSnapDistance = 20;

  private currentObject: PIXI.DisplayObject | null;
  private readonly edgeDrawHandler: EdgeDrawHandler;

  private readonly edgeDragAbortListeners: {[key: string]: Array<() => void>} = {};
  private readonly vertexDragAbortListeners: {[key: string]: Array<() => void>} = {};

  constructor(
    private readonly sendModelChangeRequests: (...reqs: ModelChangeRequest[]) => void,
    private readonly sendModelInfoRequest: <T extends ModelInfoRequestType>(
      req: ModelInfoRequestMap[T],
    ) => Promise<ModelInfoResponseMap[T]>,
    sendModelVersioningRequest: (req: ModelVersioningRequest) => Promise<boolean>,
    private readonly getVertexWrappers: () => Readonly<{[key: string]: VertexWrapper}>,
    private readonly getEdgeWrappers: () => Readonly<{[key: string]: EdgeWrapper}>,
    private readonly getPortWrappers: () => Readonly<{[vertexKey: string]: Readonly<{[portKey: string]: PortWrapper}>}>,
    private readonly backgroundWrapper: BackgroundWrapper,
    private readonly selectionManager: SelectionManager,
    private readonly portPreviewManager: PortPreviewManager,
    renderer: PIXI.WebGLRenderer | PIXI.CanvasRenderer,
  ) {
    this.currentObject = null;
    this.edgeDrawHandler = new EdgeDrawHandler(this.backgroundWrapper);
    this.registerBackground(this.backgroundWrapper);
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
      for (const portKey in this.getPortWrappers()[vertexKey]) {
        const portWrapper = this.getPortWrappers()[vertexKey][portKey];
        const xDistance = targetX - (portWrapper.localX() + vertexWrapper.localX() + portWrapper.getBackgroundWidth()/2);
        const yDistance = targetY - (portWrapper.localY() + vertexWrapper.localY() + portWrapper.getBackgroundHeight()/2);
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
    new VertexDragHandler(id, vertex, listeners, this.selectionManager, this.backgroundWrapper);
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

    new EdgeDragHandler(id, edge, listeners, this.selectionManager, this.backgroundWrapper);
  }

  public removeEdge(id: string, edge: EdgeWrapper): void {
    this.selectionManager.removeDeletedEdge(id, edge);

    if (this.currentObject === edge.getDisplayObject()) {
      this.currentObject = null;

      for (const l of this.edgeDragAbortListeners[id]) l();
    }

    delete this.edgeDragAbortListeners[id];
  }

  public registerEditIcon(editIcon: EditIconWrapper, clickBegin: () => void, clickEnd: () => void): void {
    const listeners = this.registerDisplayObject(editIcon.getDisplayObject());
    listeners.onDragStart(clickBegin);
    listeners.onDragEnd(clickEnd);
  }

  public registerPort(vertexId: string, vertex: VertexWrapper, portId: string, port: PortWrapper): void {
    const listeners = this.registerDisplayObject(port.getDisplayObject());
    const portDragHandler = new PortDragHandler(port, listeners);


    portDragHandler.addListener("click", () => {
      this.portPreviewManager.editPort(port, vertexId, portId);
    });

    let isHovering = false;
    portDragHandler.addListener("hover", async () => {
      if (this.portPreviewManager.currentShowingIs(port)) return;
      const portInfo = await this.sendModelInfoRequest<"getPortInfo">({type: "getPortInfo", vertexId: vertexId, portId: portId});
      if (!portInfo.couldFindPort) return;
      this.portPreviewManager.portHover(port, vertex, portId, vertexId, portInfo.portValue);
      isHovering = true;
    });
    portDragHandler.addListener("hoverend", () => {
      if (isHovering) {
        this.portPreviewManager.portHoverEnd(port);
        isHovering = false;
      }
    });

    if (port.getIsOutput()) {
      const getSnapPortInfo = async (cursorLocalX: number, cursorLocalY: number) => {
        const closestInfo = this.portsByCloseness(cursorLocalX, cursorLocalY)[0];

        const closestPortVertex = closestInfo.vtx;
        const closestPort = closestInfo.port;

        if (
          (closestPortVertex !== vertex || closestPort !== port) &&
          closestInfo.distanceSquared < DragRegistry.portSnapDistance*DragRegistry.portSnapDistance
        ) {
          const uniqueEdgeId = (await this.sendModelInfoRequest<"getUniqueEdgeId">({
            type: "getUniqueEdgeId",
          })).edgeId;

          const edgeValidityInfo = await this.sendModelInfoRequest<"validateEdge">({
            type: "validateEdge",
            edgeId: uniqueEdgeId,
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
            xPos: closestPort.localX() + closestPort.getBackgroundWidth()/2 + closestPortVertex.localX(),
            yPos: closestPort.localY() + closestPort.getBackgroundWidth()/2 + closestPortVertex.localY(),
            problem: edgeValidityInfo.valid ? null : edgeValidityInfo.problem,
          };
        } else {
          return null;
        }
      };

      portDragHandler.addListener("dragStart", () => {
        this.edgeDrawHandler.beginDraw(vertex, port);
      });
      let currentTarget: {
        port: PortWrapper;
        portId: string;
        vertexId: string;
        isValid: boolean;
      } | null = null;
      portDragHandler.addListener("dragMove", async (cursorX, cursorY) => {
        const cursorLocalX = (cursorX - this.backgroundWrapper.localX())/this.backgroundWrapper.localScale();
        const cursorLocalY = (cursorY - this.backgroundWrapper.localY())/this.backgroundWrapper.localScale();
        const snapPortInfo = await getSnapPortInfo(cursorLocalX, cursorLocalY);

        // snap to closest port
        if (snapPortInfo !== null) {
          this.edgeDrawHandler.redrawLine(
            snapPortInfo.xPos,
            snapPortInfo.yPos,
            snapPortInfo.problem === null ? "valid" : "invalid",
          );
          if (currentTarget === null || currentTarget.port !== snapPortInfo.targetPort) {
            currentTarget = {
              port: snapPortInfo.targetPort,
              portId: snapPortInfo.targetPortId,
              vertexId: snapPortInfo.targetVtxId,
              isValid: snapPortInfo.problem === null,
            };
            setTimeout(() => {
              // if the target is still the same
              if (currentTarget !== null && currentTarget.port === snapPortInfo.targetPort) {
                this.portPreviewManager.portHover(
                  snapPortInfo.targetPort,
                  snapPortInfo.targetVtx,
                  snapPortInfo.targetPortId,
                  snapPortInfo.targetVtxId,
                  snapPortInfo.problem === null ? "Valid target" : snapPortInfo.problem,
                );
              }
            }, DragRegistry.portTargetHoverWait);
          }
        } else {
          this.edgeDrawHandler.redrawLine(cursorLocalX, cursorLocalY);
          if (currentTarget !== null && this.portPreviewManager.currentShowingIs(currentTarget.port)) {
            this.portPreviewManager.portHoverEnd(currentTarget.port);
          }
          currentTarget = null;
        }
      });
      portDragHandler.addListener("dragEnd", (cursorX, cursorY) => {
        this.edgeDrawHandler.endDrag();

        // const cursorLocalX = (cursorX - this.backgroundWrapper.localX())/this.backgroundWrapper.localScale();
        // const cursorLocalY = (cursorY - this.backgroundWrapper.localY())/this.backgroundWrapper.localScale();

        // const snapPortInfo = getSnapPortInfo(cursorLocalX, cursorLocalY);

        if (currentTarget !== null && currentTarget.isValid) {
          this.sendModelChangeRequests({
            newEdgeId: this.uniqueEdgeId(),
            type: "createEdge",
            sourceVertexId: vertexId,
            sourcePortId: portId,
            targetVertexId: currentTarget.vertexId,
            targetPortId: currentTarget.portId,
          });
        }
        if (currentTarget !== null) {
          this.portPreviewManager.portHoverEnd(currentTarget.port);
        }
        currentTarget = null;
      });
      portDragHandler.addListener("dragAbort", () => {
        this.edgeDrawHandler.endDrag();
      });
    }
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
