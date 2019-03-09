import { PortWrapper } from "../graphicWrappers/portWrapper.js";
import { IDragListenerAdder } from "./dragRegistry.js";

interface IListenerTypes {
  dragStart(x: number, y: number): void;
  dragMove(x: number, y: number): void;
  dragEnd(x: number, y: number): void;
  dragAbort(): void;
  click(): void;
  hover(): void;
  hoverend(): void;
}

type ArgumentTypes<F extends (...args: any[]) => any> = F extends (...args: infer A) => unknown ? A : never;

/** Class for monitoring the click and drag events on a port */
export class PortDragHandler {
  private static readonly hoverTimeWait = 150; // milliseconds
  private static readonly dragThreshold = 8;
  private readonly listenerDict: {[key in keyof IListenerTypes]: Array<IListenerTypes[key]>} = {
    click: [],
    dragAbort: [],
    dragEnd: [],
    dragMove: [],
    dragStart: [],
    hover: [],
    hoverend: [],
  };

  /**
   * Constructs a port drag handler.
   * @param port - The port wrapper
   * @param listenerAdder - The drag listener adder for the port
   */
  constructor(port: PortWrapper, listenerAdder: IDragListenerAdder) {
    const that = this;

    let clickData: {
      startGlobalX: number;
      startGlobalY: number;
      isDrag: boolean;
    } | null = null;

    listenerAdder.onDragStart((ev) => {
      if (clickData !== null) {
        throw new Error("click in progress");
      }

      clickData = {
        isDrag: false,
        startGlobalX: ev.data.global.x,
        startGlobalY: ev.data.global.x,
      };
    });
    listenerAdder.onDragMove((ev) => {
      if (clickData === null) {
        throw new Error("no click in progress");
      }

      if (!clickData.isDrag) {
        const dx = ev.data.global.x - clickData.startGlobalX;
        const dy = ev.data.global.y - clickData.startGlobalY;

        if (dx * dx + dy * dy >= PortDragHandler.dragThreshold * PortDragHandler.dragThreshold) {
          clickData.isDrag = true;

          that.callListeners("dragStart", ev.data.global.x, ev.data.global.y);
        }
      }

      if (clickData.isDrag) {
        that.callListeners("dragMove", ev.data.global.x, ev.data.global.y);
      }
    });
    listenerAdder.onDragEnd((ev) => {
      if (clickData === null) {
        throw new Error("no click in progress");
      }

      if (clickData.isDrag) {
        that.callListeners("dragEnd", ev.data.global.x, ev.data.global.y);
      } else {
        that.callListeners("click");
      }

      clickData = null;
    });
    listenerAdder.onDragAbort(() => {
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

  /**
   * Adds a listener for the given event.
   * @param eventName 
   * @param listener 
   */
  public addListener<T extends keyof IListenerTypes>(eventName: T, listener: IListenerTypes[T]): void {
    (this.listenerDict[eventName] as Array<IListenerTypes[T]>).push(listener);
  }

  /**
   * Calls the listeners of the the given event type with the given event arguments.
   * @param evName - The name of the event
   * @param listenerArgs - The arguments for calling the event listeners
   */
  private callListeners<T extends keyof IListenerTypes>(evName: T, ...listenerArgs: ArgumentTypes<IListenerTypes[T]>) {
    const listeners = this.listenerDict[evName] as Array<IListenerTypes[T]>;
    for (const listener of listeners) {
      (listener as (...args: ArgumentTypes<IListenerTypes[T]>) => unknown)(...listenerArgs);
    }
  }
}
