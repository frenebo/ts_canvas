import { BackgroundWrapper } from "./backgroundWrapper";
import { DragRegistry } from "./dragRegistry";

export class BackgroundDragHandler {
  private backgroundWrapper: BackgroundWrapper;
  private dragRegistry: DragRegistry;
  private dragData: {
    mouseStart: {
      x: number;
      y: number;
    };
    backgroundStart: {
      x: number;
      y: number;
    };
  } | null = null;

  constructor(backgroundWrapper: BackgroundWrapper, dragRegistry: DragRegistry) {
    this.backgroundWrapper = backgroundWrapper;
    this.dragRegistry = dragRegistry;

    const that = this;

    this.backgroundWrapper
      .on('mousedown',       (event: PIXI.interaction.InteractionEvent) => that.onDragStart(event))
      .on('touchstart',      (event: PIXI.interaction.InteractionEvent) => that.onDragStart(event))
      .on('mouseup',         (event: PIXI.interaction.InteractionEvent) => that.onDragEnd(event))
      .on('mouseupoutside',  (event: PIXI.interaction.InteractionEvent) => that.onDragEnd(event))
      .on('touchend',        (event: PIXI.interaction.InteractionEvent) => that.onDragEnd(event))
      .on('touchendoutside', (event: PIXI.interaction.InteractionEvent) => that.onDragEnd(event))
      .on('mousemove',       (event: PIXI.interaction.InteractionEvent) => that.onDragMove(event))
      .on('touchmove',       (event: PIXI.interaction.InteractionEvent) => that.onDragMove(event));
  }

  private onDragStart(event: PIXI.interaction.InteractionEvent): void {
    if (this.dragData !== null) throw new Error("Previous drag has not ended");
    if (this.dragRegistry.isLocked()) return;
    this.dragRegistry.lock();

    console.log("Background drag start");

    this.dragData = {
      mouseStart: {
        x: event.data.global.x,
        y: event.data.global.y,
      },
      backgroundStart: {
        x: this.backgroundWrapper.getX(),
        y: this.backgroundWrapper.getY(),
      },
    };
  }

  private onDragMove(event: PIXI.interaction.InteractionEvent): void {
    if (this.dragData === null) return;

    const deltaX = event.data.global.x - this.dragData.mouseStart.x;
    const deltaY = event.data.global.y - this.dragData.mouseStart.y;

    this.backgroundWrapper.setPosition(this.dragData.backgroundStart.x + deltaX, this.dragData.backgroundStart.y + deltaY);
  }

  private onDragEnd(event: PIXI.interaction.InteractionEvent): void {
    if (this.dragData === null) return;

    this.dragData = null;
    this.dragRegistry.unlock();
  }
}
