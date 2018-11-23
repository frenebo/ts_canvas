import { DragListeners } from "./dragRegistry.js";
import { PortWrapper } from "../portWrapper.js";

export class PortDragHandler {
  private readonly portDragStartListeners: Array<(x: number, y: number) => void> = [];
  private readonly portDragMoveListeners: Array<(x: number, y: number) => void> = [];
  private readonly portDragEndListeners: Array<(x: number, y: number) => void> = [];
  private readonly portDragAbortListeners: Array<() => void> = [];
  constructor(port: PortWrapper, listeners: DragListeners) {
    const that = this;

    if (port.getIsOutput()) {
      listeners.onDragStart((ev) => {
        for (const listener of that.portDragStartListeners) {
          listener(ev.data.global.x, ev.data.global.y);
        }
      });
      listeners.onDragMove((ev) => {
        for (const listener of that.portDragMoveListeners) {
          listener(ev.data.global.x, ev.data.global.y);
        }
      });
      listeners.onDragEnd((ev) => {
        for (const listener of that.portDragEndListeners) {
          listener(ev.data.global.x, ev.data.global.y);
        }
      });
      listeners.onDragAbort(() => {
        for (const listener of that.portDragAbortListeners) {
          listener();
        }
      });
    }
  }

  public onPortDragStart(listener: (x: number, y: number) => void) {
    this.portDragStartListeners.push(listener);
  }
  public onPortDragMove(listener: (x: number, y: number) => void) {
    this.portDragMoveListeners.push(listener);
  }
  public onPortDragEnd(listener: (x: number, y: number) => void) {
    this.portDragEndListeners.push(listener);
  }
  public onPortDragAbort(listener: () => void) {
    this.portDragAbortListeners.push(listener);
  }
}
