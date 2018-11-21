import { BackgroundWrapper } from "./backgroundWrapper";
import { DragRegistry } from "./dragRegistry";

export class BackgroundDragHandler {
  private backgroundWrapper: BackgroundWrapper;
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

    const that = this;

    this.backgroundWrapper.onDragStart(ev => that.onDragStart(ev));
    this.backgroundWrapper.onDragMove(ev => that.onDragMove(ev));
    this.backgroundWrapper.onDragEnd(ev => that.onDragEnd(ev));
  }

  private onDragStart(event: PIXI.interaction.InteractionEvent): void {
    if (this.dragData !== null) throw new Error("Previous drag has not ended");

    this.dragData = {
      mouseStart: {
        x: event.data.global.x,
        y: event.data.global.y,
      },
      backgroundStart: {
        x: this.backgroundWrapper.localX(),
        y: this.backgroundWrapper.localY(),
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
  }
}
