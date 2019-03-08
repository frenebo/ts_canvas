
import {
  RequestInfoFunc,
  RequestModelChangesFunc,
} from "../../messenger.js";
import { EdgeWrapper } from "../graphicWrappers/edgeWrapper.js";
import { EditIconWrapper } from "../graphicWrappers/editIconWrapper.js";
import { PortWrapper } from "../graphicWrappers/portWrapper.js";
import { VertexWrapper } from "../graphicWrappers/vertexWrapper.js";
import { PortPreviewManager } from "../portPreviewManager.js";
import { SelectionManager } from "../selectionManager.js";
import { StageInterface } from "../stageInterface.js";
import { BackgroundDragHandler } from "./backgroundDragHandler.js";
import { EdgeDragHandler } from "./edgeDragHandler.js";
import { EdgeDrawHandler } from "./edgeDrawHandler.js";
import { PortDragHandler } from "./portDragHandler.js";
import { VertexDragHandler } from "./vertexDragHandler.js";

export type DragListener = (ev: PIXI.interaction.InteractionEvent) => unknown;

export interface IDragListenerAdder {
  onDragStart(listener: DragListener): void;
  onDragMove(listener: DragListener): void;
  onDragEnd(listener: DragListener): void;
  onDragAbort(listener: () => void): void;
}

/** Class for keeping track of object clicking and dragging */
export class DragRegistry {
  private static readonly portSnapDistance = 20;

  private currentObject: PIXI.DisplayObject | null;
  private readonly edgeDrawHandler: EdgeDrawHandler;

  private readonly edgeDragAbortListeners: {[key: string]: Array<() => void>} = {};
  private readonly vertexDragAbortListeners: {[key: string]: Array<() => void>} = {};

  private readonly registeredVertices: {[key: string]: VertexWrapper} = {};
  private readonly registeredPorts: {[vertexKey: string]: {[portKey: string]: PortWrapper}} = {};

  /**
   * Constructs a drag registry.
   * @param sendModelChangeRequests - An async function for sending model change requests
   * @param sendModelInfoRequests - An async function for sending model info requests
   * @param getVertexWrappers - A function for getting the graph's vertex wrappers
   * @param getPortWrappers - A function for getting the graph's port wrappers
   * @param selectionManager - The selection manager the drag registry interacts with
   * @param portPreviewManager - The port preview manager the drag registry interacts with
   * @param stageInterface - The interface used to interact with the PIXI stage
   */
  constructor(
    private readonly sendModelChangeRequests: RequestModelChangesFunc,
    private readonly sendModelInfoRequests: RequestInfoFunc,
    private readonly selectionManager: SelectionManager,
    private readonly portPreviewManager: PortPreviewManager,
    private readonly stageInterface: StageInterface,
  ) {
    this.currentObject = null;
    this.edgeDrawHandler = new EdgeDrawHandler(this.stageInterface);
    this.registerBackground(this.stageInterface.getBackgroundDisplayObject());
  }

  /**
   * Registers a vertex with the drag registry.
   * @param id - The id of the vertex
   * @param vertex - The vertex wrapper
   */
  public registerVertex(id: string, vertex: VertexWrapper): void {
    this.registeredVertices[id] = vertex;
    this.vertexDragAbortListeners[id] = [];
    const listeners = this.setUpDisplayObjectListeners(
      vertex.getDisplayObject(),
      (l) => this.vertexDragAbortListeners[id].push(l),
    );
    const vtxDragHandler = new VertexDragHandler(id, vertex, listeners, this.selectionManager, this.stageInterface);
  }

  /**
   * Removes a vertex from the drag registry.
   * @param id - The id of the vertex
   */
  public removeVertex(id: string): void {
    const vertex = this.registeredVertices[id];
    this.selectionManager.removeDeletedVertex(id);

    if (this.currentObject === vertex.getDisplayObject()) {
      this.currentObject = null;

      for (const l of this.vertexDragAbortListeners[id]) {
        l();
      }
    }

    delete this.vertexDragAbortListeners[id];
    delete this.registeredVertices[id];
  }

  /**
   * Adds an edge to the drag registry.
   * @param id - The id of the edge
   * @param edge - The edge wrapper
   */
  public registerEdge(id: string, edge: EdgeWrapper): void {
    this.edgeDragAbortListeners[id] = [];
    const listeners = this.setUpDisplayObjectListeners(
      edge.getDisplayObject(),
      (l) => this.edgeDragAbortListeners[id].push(l),
    );

    const edgeDragHandler = new EdgeDragHandler(id, edge, listeners, this.selectionManager, this.stageInterface);
  }

  /**
   * Removes an edge from the drag registry.
   * @param id - The id of the edge
   * @param edge - The edge wrapper
   */
  public removeEdge(id: string, edge: EdgeWrapper): void {
    this.selectionManager.removeDeletedEdge(id, edge);

    if (this.currentObject === edge.getDisplayObject()) {
      this.currentObject = null;

      for (const l of this.edgeDragAbortListeners[id]) {
        l();
      }
    }

    delete this.edgeDragAbortListeners[id];
  }

  /**
   * Registers an edit icon with the drag registry.
   * @param editIcon - The edit icon
   * @param clickBegin - A method to call back when an edit icon click begins
   * @param clickEnd - A method to call back when an edit icon click ends
   */
  public registerEditIcon(editIcon: EditIconWrapper, clickBegin: () => void, clickEnd: () => void): void {
    const listeners = this.setUpDisplayObjectListeners(editIcon.getDisplayObject());
    listeners.onDragStart(clickBegin);
    listeners.onDragEnd(clickEnd);
  }

  /**
   * Removes a port from the drag registry.
   * @param vertexId - The port's vertex's id
   * @param portId - The port id
   */
  public removePort(vertexId: string, portId: string): void
  {
    delete this.registeredPorts[vertexId][portId];
    if (Object.keys(this.registeredPorts[vertexId]).length == 0)
    {
      delete this.registeredPorts[vertexId];
    }
  }

  /**
   * Registers a port with the drag registry.
   * @param vertexId - The id of the port's vertex
   * @param vertex - The port's vertex wrapper
   * @param portId - The id of the port
   * @param port - The port wrapper
   */
  public registerPort(vertexId: string, vertex: VertexWrapper, portId: string, port: PortWrapper): void {
    if (!this.registeredPorts.hasOwnProperty(vertexId))
    {
      this.registeredPorts[vertexId] = {};
    }
    this.registeredPorts[vertexId][portId] = port;
    
    const listeners = this.setUpDisplayObjectListeners(port.getDisplayObject());
    const portDragHandler = new PortDragHandler(port, listeners);

    let isHovering = false;
    portDragHandler.addListener("hover", async () => {
      if (this.portPreviewManager.currentShowingIs(port)) {
        return;
      }

      isHovering = true;

      const portInfo = await this.sendModelInfoRequests<"getPortInfo">({
        portId: portId,
        type: "getPortInfo",
        vertexId: vertexId,
      });

      if (!portInfo.couldFindPort) {
        return;
      }

      if (!isHovering) {
        return; // if the mouse has left by the time the model info is gotten
      }

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
          closestInfo.distanceSquared < DragRegistry.portSnapDistance * DragRegistry.portSnapDistance
        ) {

          return {
            targetPort: closestPort,
            targetPortId: closestInfo.portKey,
            targetVtx: closestPortVertex,
            targetVtxId: closestInfo.vtxKey,
            xPos: closestPort.localX() + PortWrapper.width / 2 + closestPortVertex.localX(),
            yPos: closestPort.localY() + PortWrapper.width / 2 + closestPortVertex.localY(),
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
        if (dragData === null) {
          throw new Error("No current drag");
        }

        const stageX = (cursorX - this.stageInterface.getStageX()) / this.stageInterface.getScale();
        const stageY = (cursorY - this.stageInterface.getStageY()) / this.stageInterface.getScale();

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
              validation: "waiting_for_validity",
              vertexId: snapInfo.targetVtxId,
              xPos: snapInfo.xPos,
              yPos: snapInfo.yPos,
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
            count: 1,
            type: "getUniqueEdgeIds",
          }).then(async ({ edgeIds }) => {
            return [
              await this.sendModelInfoRequests<"validateEdge">({
                edgeId: edgeIds[0],
                sourcePortId: portId,
                sourceVertexId: vertexId,
                targetPortId: snapInfo.targetPortId,
                targetVertexId: snapInfo.targetVtxId,
                type: "validateEdge",
              }),
              edgeIds[0],
            ] as [IModelInfoReqs["validateEdge"]["response"], string];
          }).then(([response, edgeId]) => {
            // do nothing if the current target has changed by the time the edge has been validated
            if (
              dragData !== null &&
              dragData.currentTarget !== null &&
              dragData.currentTarget.portId === snapInfo.targetPortId &&
              dragData.currentTarget.vertexId === snapInfo.targetVtxId
            ) {
              dragData.currentTarget.validation = response.valid ? {
                edgeId: edgeId,
                isValid: true,
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
            newEdgeId: dragData.currentTarget.validation.edgeId,
            sourcePortId: portId,
            sourceVertexId: vertexId,
            targetPortId: dragData.currentTarget.portId,
            targetVertexId: dragData.currentTarget.vertexId,
            type: "createEdge",
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

  /**
   * Sorts registered ports by closeness to a pair of coordinates.
   * @param targetX - The Y coordinate
   * @param targetY - The X coordinate
   * @returns An array of port descriptions, sorted by distance from the coordinates
   */
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

    for (const vertexKey in this.registeredVertices) {
      const vertexWrapper = this.registeredVertices[vertexKey];
      for (const portKey in this.registeredPorts[vertexKey]) {
        const portWrapper = this.registeredPorts[vertexKey][portKey];
        const xDistance = targetX - (portWrapper.localX() + vertexWrapper.localX() + PortWrapper.width / 2);
        const yDistance = targetY - (portWrapper.localY() + vertexWrapper.localY() + PortWrapper.height / 2);
        portDescriptions.push({
          distanceSquared: xDistance * xDistance + yDistance * yDistance,
          port: portWrapper,
          portKey: portKey,
          vtx: vertexWrapper,
          vtxKey: vertexKey,
        });
      }
    }

    const sortedDescriptions = portDescriptions.sort((d1, d2) => d1.distanceSquared - d2.distanceSquared);

    return sortedDescriptions;
  }

  /**
   * Registers a PIXI DisplayObject as a graph background.
   * @param backgroundObj - The background display object
   */
  private registerBackground(backgroundObj: PIXI.DisplayObject): void {
    const listeners = this.setUpDisplayObjectListeners(backgroundObj);
    const bgDragHandler = new BackgroundDragHandler(this.selectionManager, this.stageInterface, listeners);
  }

  /**
   * Sets up listeners with the given display object.
   * @param obj 
   * @param setAbortListener - An optional method, that, if provided, will be called with a function to abort a click event as an argument to the callback
   */
  private setUpDisplayObjectListeners(obj: PIXI.DisplayObject, setAbortListener?: (l: () => void) => void): IDragListenerAdder {
    const dragStartListeners: DragListener[] = [];
    const dragMoveListeners: DragListener[] = [];
    const dragEndListeners: DragListener[] = [];
    const dragAbortListeners: Array<() => void> = [];

    let dragging = false;

    const onDragStart = (ev: PIXI.interaction.InteractionEvent) => {
      if (this.currentObject !== null) {
        return;
      }

      this.currentObject = obj;
      dragging = true;

      for (const listener of dragStartListeners) {
        listener(ev);
      }
    };

    const onDragMove = (ev: PIXI.interaction.InteractionEvent) => {
      if (!dragging) {
        return;
      }

      for (const listener of dragMoveListeners) {
        listener(ev);
      }
    };

    const onDragEnd = (ev: PIXI.interaction.InteractionEvent) => {
      if (!dragging) {
        return;
      }

      dragging = false;
      this.currentObject = null;

      for (const listener of dragEndListeners) {
        listener(ev);
      }
    };

    const callAbortListeners = () => {
      for (const listener of dragAbortListeners) {
        listener();
      }
    };

    if (setAbortListener !== undefined) {
      setAbortListener(callAbortListeners);
    }

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
      onDragAbort: (listener: () => void) => { dragAbortListeners.push(listener); },
      onDragEnd: (listener: DragListener) => { dragEndListeners.push(listener); },
      onDragMove: (listener: DragListener) => { dragMoveListeners.push(listener); },
      onDragStart: (listener: DragListener) => { dragStartListeners.push(listener); },
    };
  }
}
