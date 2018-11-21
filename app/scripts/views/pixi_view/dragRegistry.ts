import { VertexWrapper } from "./vertexWrapper.js";
import { VertexDragHandler } from "./vertexDragHandler.js";

export class DragRegistry {
  private locked: boolean;
  constructor() {
    this.locked = false;
  }

  public addVertex(vertex: VertexWrapper, listener: (x: number, y: number, ctrlKey: boolean) => void): void {
    const dragHandler = new VertexDragHandler(vertex, this);
    dragHandler.afterDrag((x: number, y: number, ctrlKey: boolean) => {
      console.log("vertex drag");

      if (listener !== undefined) listener(x, y, ctrlKey);
    });
  }

  public isLocked(): boolean {
    return this.locked;
  }

  public lock(): void {
    this.locked = true;
  }

  public unlock(): void {
    this.locked = false;
  }
}
