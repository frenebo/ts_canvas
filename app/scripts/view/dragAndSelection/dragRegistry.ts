
import { BackgroundDragHandler } from "./backgroundDragHandler.js";
import { EdgeWrapper } from "../graphicWrappers/edgeWrapper.js";
import { VertexWrapper } from "../graphicWrappers/vertexWrapper.js";
import { VertexDragHandler } from "./vertexDragHandler.js";
import { PortWrapper } from "../graphicWrappers/portWrapper.js";
import { PortDragHandler } from "./portDragHandler.js";
import { EdgeDrawHandler } from "./edgeDrawHandler.js";
import { EditIconWrapper } from "../graphicWrappers/editIconWrapper.js";
import { SelectionManager } from "../selectionManager.js";
import { EdgeDragHandler } from "./edgeDragHandler.js";
import { PortPreviewManager } from "../portPreviewManager.js";
import {
  RequestModelChangesFunc,
  RequestInfoFunc,
} from "../../messenger.js";
import { ModelInfoReqs } from "../../interfaces.js";
import { BackgroundWrapper } from "../graphicWrappers/backgroundWrapper.js";
import { StageInterface } from "../stageInterface.js";

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

  private readonly edgeDragAbortListeners: {[key: string]: Array<() => void>} = {};
  private readonly vertexDragAbortListeners: {[key: string]: Array<() => void>} = {};

  constructor(
    private readonly sendModelChangeRequests: RequestModelChangesFunc,
    private readonly sendModelInfoRequests: RequestInfoFunc,
    private readonly getVertexWrappers: () => Readonly<{[key: string]: VertexWrapper}>,
    private readonly getEdgeWrappers: () => Readonly<{[key: string]: EdgeWrapper}>,
    private readonly getPortWrappers: () => Readonly<{[vertexKey: string]: Readonly<{[portKey: string]: PortWrapper}>}>,
    private readonly selectionManager: SelectionManager,
    private readonly portPreviewManager: PortPreviewManager,
    private readonly stageInterface: StageInterface,
  ) {
    this.currentObject = null;
    this.edgeDrawHandler = new EdgeDrawHandler(this.stageInterface);
    this.registerBackground(this.stageInterface.getBackgroundDisplayObject());
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
        const xDistance = targetX - (portWrapper.localX() + vertexWrapper.localX() + PortWrapper.width/2);
        const yDistance = targetY - (portWrapper.localY() + vertexWrapper.localY() + PortWrapper.height/2);
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

  private registerBackground(backgroundObj: PIXI.DisplayObject): void {
    const listeners = this.registerDisplayObject(backgroundObj);
    new BackgroundDragHandler(this.selectionManager, this.stageInterface, listeners);
  }

  public registerVertex(id: string, vertex: VertexWrapper): void {
    this.vertexDragAbortListeners[id] = [];
    const listeners = this.registerDisplayObject(
      vertex.getDisplayObject(),
      (l) => this.vertexDragAbortListeners[id].push(l),
    );
    new VertexDragHandler(id, vertex, listeners, this.selectionManager, this.stageInterface);
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

    new EdgeDragHandler(id, edge, listeners, this.selectionManager, this.stageInterface);
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
      isHovering = true;

      const portInfo = await this.sendModelInfoRequests<"getPortInfo">({
        type: "getPortInfo",
        vertexId: vertexId,
        portId: portId,
      });

      if (!portInfo.couldFindPort) return;
      if (!isHovering) return; // if the mouse has left by the time the model info is gotten
      this.portPreviewManager.portHover(port, vertex, portId, vertexId, portInfo.portValue);
    });
    portDragHandler.addListener("hoverend", () => {
      if (isHovering) {
        this.portPreviewManager.portHoverEnd(port);
        isHovering = false;
      }
    });

    if (port.getIsOutput()) {
      const getSnapPortInfo = (cursorLocalX: number, cursorLocalY: number) => {
        const closestInfo = this.portsByCloseness(cursorLocalX, cursorLocalY)[0];

        const closestPortVertex = closestInfo.vtx;
        const closestPort = closestInfo.port;

        if (
          (closestPortVertex !== vertex || closestPort !== port) &&
          closestInfo.distanceSquared < DragRegistry.portSnapDistance*DragRegistry.portSnapDistance
        ) {

          return {
            targetVtx: closestPortVertex,
            targetPort: closestPort,
            targetVtxId: closestInfo.vtxKey,
            targetPortId: closestInfo.portKey,
            xPos: closestPort.localX() + PortWrapper.width/2 + closestPortVertex.localX(),
            yPos: closestPort.localY() + PortWrapper.width/2 + closestPortVertex.localY(),
          };
        } else {
          return null;
        }
      };

      let dragData: {
        currentTarget: {
          port: PortWrapper;
          portId: string;
          xPos: number;
          yPos: number;
          vertexId: string;
          validation: {
            isValid: true;
            edgeId: string;
          } | {
            isValid: false;
            message: string;
          } | "waiting_for_validity";
        } | null;
      } | null = null;
      portDragHandler.addListener("dragStart", () => {
        this.edgeDrawHandler.beginDraw(vertex, port);
        dragData = {
          currentTarget: null,
        };
      });
      portDragHandler.addListener("dragMove", (cursorX, cursorY) => {
        if (dragData === null) throw new Error("No current drag");

        const stageX = (cursorX - this.stageInterface.getStageX())/this.stageInterface.getScale();
        const stageY = (cursorY - this.stageInterface.getStageY())/this.stageInterface.getScale();

        let targetHasChanged = false;
        const snapInfo = getSnapPortInfo(stageX, stageY);
        if (snapInfo === null) {
          if (dragData.currentTarget !== null) {
            this.portPreviewManager.portHoverEnd(dragData.currentTarget.port);
          }
          dragData.currentTarget = null;
        } else {
          if (
            dragData.currentTarget === null ||
            dragData.currentTarget.portId !== snapInfo.targetPortId ||
            dragData.currentTarget.vertexId !== snapInfo.targetVtxId
          ) {
            targetHasChanged = true;
            dragData.currentTarget = {
              port: snapInfo.targetPort,
              portId: snapInfo.targetPortId,
              xPos: snapInfo.xPos,
              yPos: snapInfo.yPos,
              vertexId: snapInfo.targetVtxId,
              validation: "waiting_for_validity",
            };
          }
        }

        let lineEndX: number;
        let lineEndY: number;
        let validity: "valid" | "invalid" | undefined;

        if (dragData.currentTarget === null || dragData.currentTarget.validation === "waiting_for_validity") {
          lineEndX = stageX;
          lineEndY = stageY;
        } else {
          lineEndX = dragData.currentTarget.xPos;
          lineEndY = dragData.currentTarget.yPos;
          validity = dragData.currentTarget.validation.isValid ? "valid" : "invalid";

        }

        this.edgeDrawHandler.redrawLine(
          lineEndX,
          lineEndY,
          validity,
        );

        if (
          // An edge validity will only be checked if there is a port to snap to and if the target has changed
          snapInfo !== null && targetHasChanged
        ) {
          this.sendModelInfoRequests<"getUniqueEdgeIds">({
            type: "getUniqueEdgeIds",
            count: 1,
          }).then(async ({ edgeIds }) => {
            return [
              await this.sendModelInfoRequests<"validateEdge">({
                type: "validateEdge",
                edgeId: edgeIds[0],
                sourceVertexId: vertexId,
                sourcePortId: portId,
                targetVertexId: snapInfo.targetVtxId,
                targetPortId: snapInfo.targetPortId,
              }),
              edgeIds[0],
            ] as [ModelInfoReqs["validateEdge"]["response"], string];
          }).then(([response, edgeId]) => {
            // do nothing if the current target has changed by the time the edge has been validated
            if (
              dragData !== null &&
              dragData.currentTarget !== null &&
              dragData.currentTarget.portId === snapInfo.targetPortId &&
              dragData.currentTarget.vertexId === snapInfo.targetVtxId
            ) {
              dragData.currentTarget.validation = response.valid ? {
                isValid: true,
                edgeId: edgeId,
              } : {
                isValid: false,
                message: response.problem,
              };

              this.edgeDrawHandler.redrawLine(
                snapInfo.xPos,
                snapInfo.yPos,
                dragData.currentTarget.validation.isValid ? "valid" : "invalid",
              );

              this.portPreviewManager.portHover(
                snapInfo.targetPort,
                snapInfo.targetVtx,
                snapInfo.targetPortId,
                snapInfo.targetVtxId,
                dragData.currentTarget.validation.isValid ? "Valid target" : dragData.currentTarget.validation.message,
              );
            }
          }).catch(() => {
            // @TODO
          });
        }
      });

      portDragHandler.addListener("dragEnd", () => {
        if (
          dragData !== null &&
          dragData.currentTarget !== null &&
          dragData.currentTarget.validation !== "waiting_for_validity" &&
          dragData.currentTarget.validation.isValid
        ) {
          this.sendModelChangeRequests({
            type: "createEdge",
            newEdgeId: dragData.currentTarget.validation.edgeId,
            sourceVertexId: vertexId,
            sourcePortId: portId,
            targetVertexId: dragData.currentTarget.vertexId,
            targetPortId: dragData.currentTarget.portId,
          }).catch((reason) => {
            // @TODO
          });

          this.portPreviewManager.portHoverEnd(dragData.currentTarget.port);
        }
        dragData = null;
        this.edgeDrawHandler.endDrag();
      });
      portDragHandler.addListener("dragAbort", () => {
        dragData = null;
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
