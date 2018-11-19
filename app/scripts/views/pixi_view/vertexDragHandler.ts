import { VertexWrapper } from "./vertexWrapper.js";

export class VertexDragHandler {
  private static ghostAlpha = 0.5;
  private vtxWrapper: VertexWrapper;

  private dragData: null | {
    mouseLocalPos: {
      x: number;
      y: number;
    };
    dragOutline: PIXI.Graphics;
  } = null;
  private moveListeners: Array<(x: number, y: number) => void> = [];

  constructor(vertex: VertexWrapper) {
    this.vtxWrapper = vertex;
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

  public afterDrag(listener: (x: number, y: number) => void): void {
    this.moveListeners.push(listener);
  }

  private onDragStart(event: PIXI.interaction.InteractionEvent): void {
    const dragOutline = new PIXI.Graphics();
    this.vtxWrapper.addChild(dragOutline);

    // console.log(graphicsVertex.position);
    dragOutline.beginFill(VertexWrapper.fillColor, VertexDragHandler.ghostAlpha);
    // set the line style to have a width of 5 and set the color to red
    dragOutline.lineStyle(VertexWrapper.borderWidth, VertexWrapper.borderColor);

    // dragOutline.position.set(this.vertex.graphics.position.x, this.vertex.graphics.position.y);
    dragOutline.drawRoundedRect(0, 0, this.vtxWrapper.getWidth(), this.vtxWrapper.getHeight(), 10);

    // console.log(event.data);
    this.dragData = {
      mouseLocalPos: {
        x: event.data.global.x - this.vtxWrapper.getX(),
        y: event.data.global.y - this.vtxWrapper.getY(),
      },
      dragOutline: dragOutline,
    };
  }

  private onDragEnd(event: PIXI.interaction.InteractionEvent): void {
    if (this.dragData === null) return;

    this.vtxWrapper.removeChild(this.dragData.dragOutline);

    const newVertexX = event.data.global.x - this.dragData.mouseLocalPos.x;
    const newVertexY = event.data.global.y - this.dragData.mouseLocalPos.y;


    for (const listener of this.moveListeners) {
      listener(newVertexX, newVertexY);
    }

    this.dragData = null;
  }

  private onDragMove(event: PIXI.interaction.InteractionEvent): void {
    if (this.dragData === null) return;

    const relativeX = (event.data.global.x - this.dragData.mouseLocalPos.x) - this.vtxWrapper.getX();
    const relativeY = (event.data.global.y - this.dragData.mouseLocalPos.y) - this.vtxWrapper.getY();

    this.dragData.dragOutline.position.set(relativeX, relativeY);
  }
}
