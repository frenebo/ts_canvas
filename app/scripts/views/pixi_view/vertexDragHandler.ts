import { VertexWrapper } from "./vertexWrapper.js";
import { DragRegistry } from "./dragRegistry.js";

export class VertexDragHandler {
  private static ghostAlpha = 0.5;
  private vtxWrapper: VertexWrapper;
  private dragRegistry: DragRegistry;

  private dragData: null | {
    mouseLocalPos: {
      x: number;
      y: number;
    };
    isCtrlDrag: boolean;
    dragOutline: PIXI.Graphics;
  } = null;
  private dragListeners: Array<(x: number, y: number, ctrlKey: boolean) => void> = [];

  constructor(vertex: VertexWrapper, dragRegistry: DragRegistry) {
    this.vtxWrapper = vertex;
    this.dragRegistry = dragRegistry;
    const that = this;

    this.vtxWrapper
      .on('mousedown',       (event: PIXI.interaction.InteractionEvent) => that.onDragStart(event))
      .on('touchstart',      (event: PIXI.interaction.InteractionEvent) => that.onDragStart(event))
      .on('mouseup',         (event: PIXI.interaction.InteractionEvent) => that.onDragEnd(event))
      .on('mouseupoutside',  (event: PIXI.interaction.InteractionEvent) => that.onDragEnd(event))
      .on('touchend',        (event: PIXI.interaction.InteractionEvent) => that.onDragEnd(event))
      .on('touchendoutside', (event: PIXI.interaction.InteractionEvent) => that.onDragEnd(event))
      .on('mousemove',       (event: PIXI.interaction.InteractionEvent) => that.onDragMove(event))
      .on('touchmove',       (event: PIXI.interaction.InteractionEvent) => that.onDragMove(event));
  }

  public afterDrag(listener: (x: number, y: number, ctrlKey: boolean) => void): void {
    this.dragListeners.push(listener);
  }

  private onDragStart(event: PIXI.interaction.InteractionEvent): void {
    if (this.dragData !== null) throw new Error("Previous drag has not ended");
    if (this.dragRegistry.isLocked()) return;
    this.dragRegistry.lock();

    const dragOutline = VertexWrapper.generateBoxGraphics(VertexDragHandler.ghostAlpha);
    this.vtxWrapper.addChild(dragOutline);

    this.dragData = {
      mouseLocalPos: {
        x: this.vtxWrapper.getDataRelativeLoc(event.data).x - this.vtxWrapper.localX(),
        y: this.vtxWrapper.getDataRelativeLoc(event.data).y - this.vtxWrapper.localY(),
      },
      dragOutline: dragOutline,
      isCtrlDrag: event.data.originalEvent.ctrlKey,
    };
  }

  private onDragEnd(event: PIXI.interaction.InteractionEvent): void {
    if (this.dragData === null) return;

    this.vtxWrapper.removeChild(this.dragData.dragOutline);

    const newVertexX = this.vtxWrapper.getDataRelativeLoc(event.data).x - this.dragData.mouseLocalPos.x;
    const newVertexY = this.vtxWrapper.getDataRelativeLoc(event.data).y - this.dragData.mouseLocalPos.y;

    for (const listener of this.dragListeners) {
      listener(newVertexX, newVertexY, this.dragData.isCtrlDrag);
    }

    this.dragData = null;
    this.dragRegistry.unlock();
  }

  private onDragMove(event: PIXI.interaction.InteractionEvent): void {
    if (this.dragData === null) return;

    const relativeX = (this.vtxWrapper.getDataRelativeLoc(event.data).x - this.dragData.mouseLocalPos.x) - this.vtxWrapper.localX();
    const relativeY = (this.vtxWrapper.getDataRelativeLoc(event.data).y - this.dragData.mouseLocalPos.y) - this.vtxWrapper.localY();

    this.dragData.dragOutline.position.set(relativeX, relativeY);
  }
}
