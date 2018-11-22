import { DragListeners } from "./dragRegistry.js";
import { PortWrapper } from "../portWrapper.js";

export class PortDragHandler {
  private portDragStartListeners: Array<(x: number, y: number) => void> = [];
  private portDragMoveListeners: Array<(x: number, y: number) => void> = [];
  private portDragEndListeners: Array<(x: number, y: number) => void> = [];
  private portDragAbortListeners: Array<() => void> = [];
  constructor(port: PortWrapper, listeners: DragListeners) {
    const that = this;

    if (port.getIsOutput()) {
      listeners.onDragStart(ev => that.portDragStartListeners.forEach(l => l(ev.data.global.x, ev.data.global.y)));
      listeners.onDragMove(ev => that.portDragMoveListeners.forEach(l => l(ev.data.global.x, ev.data.global.y)));
      listeners.onDragEnd(ev => that.portDragEndListeners.forEach(l => l(ev.data.global.x, ev.data.global.y)));
      listeners.onDragAbort(() => that.portDragAbortListeners.forEach(l => l()));
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
