import { DragListeners } from "./dragRegistry.js";
import { PortWrapper } from "../graphicWrappers/portWrapper.js";

interface PortListenerTypes {
  dragStart(x: number, y: number): void;
  dragMove(x: number, y: number): void;
  dragEnd(x: number, y: number): void;
  dragAbort(): void;
  click(): void;
  hover(): void;
  hoverend(): void;
}

type ArgumentTypes<F extends Function> = F extends (...args: infer A) => unknown ? A : never;

export class PortDragHandler {
  private static readonly hoverTimeWait = 500; // milliseconds
  private static readonly dragThreshold = 8;
  private readonly listenerDict: {[key in keyof PortListenerTypes]: Array<PortListenerTypes[key]>} = {
    dragStart: [],
    dragMove: [],
    dragEnd: [],
    dragAbort: [],
    click: [],
    hover: [],
    hoverend: [],
  };

  constructor(port: PortWrapper, listeners: DragListeners) {
    const that = this;

    let clickData: {
      startGlobalX: number;
      startGlobalY: number;
      isDrag: boolean;
    } | null = null;

    listeners.onDragStart((ev) => {
      if (clickData !== null) throw new Error("click in progress");
      clickData = {
        startGlobalX: ev.data.global.x,
        startGlobalY: ev.data.global.x,
        isDrag: false,
      };
    });
    listeners.onDragMove((ev) => {
      if (clickData === null) throw new Error("no click in progress");

      if (!clickData.isDrag) {
        const dx = ev.data.global.x - clickData.startGlobalX;
        const dy = ev.data.global.y - clickData.startGlobalY;

        if (dx*dx + dy*dy >= PortDragHandler.dragThreshold*PortDragHandler.dragThreshold) {
          clickData.isDrag = true;

          that.callListeners("dragStart", ev.data.global.x, ev.data.global.y);
        }
      }

      if (clickData.isDrag) {
        that.callListeners("dragMove", ev.data.global.x, ev.data.global.y);
      }
    });
    listeners.onDragEnd((ev) => {
      if (clickData === null) throw new Error("no click in progress");

      if (clickData.isDrag) {
        that.callListeners("dragEnd", ev.data.global.x, ev.data.global.y);
      } else {
        that.callListeners("click");
      }

      clickData = null;
    });
    listeners.onDragAbort(() => {
      clickData = null;
      that.callListeners("dragAbort");
    });

    let mouseIsOver = false;
    let mouseIsHovering = false;
    port.getDisplayObject().on("mouseout", () => {
      mouseIsOver = false;
      if (mouseIsHovering) {
        that.callListeners("hoverend");
        mouseIsHovering = false;
      }
    });
    port.getDisplayObject().on("mouseover", () => {
      mouseIsOver = true;
      setTimeout(() => {
        if (mouseIsOver) {
          that.callListeners("hover");
          mouseIsHovering = true;
        }
      }, PortDragHandler.hoverTimeWait);
    });
  }

  private callListeners<T extends keyof PortListenerTypes>(
    evName: T,
    ...listenerArgs: ArgumentTypes<PortListenerTypes[T]>
  ) {
    const listeners = this.listenerDict[evName] as Array<PortListenerTypes[T]>;
    for (const listener of listeners) {
      (listener as (...args: ArgumentTypes<PortListenerTypes[T]>) => unknown)(...listenerArgs);
    }
  }

  public addListener<T extends keyof PortListenerTypes>(eventName: T, listener: PortListenerTypes[T]): void {
    (this.listenerDict[eventName] as Array<PortListenerTypes[T]>).push(listener);
  }
}
