import { BackgroundWrapper } from "../backgroundWrapper.js";
import { DragListeners } from "./dragRegistry.js";
import { SelectionManager } from "./selectionManager.js";

export class BackgroundDragHandler {
  private static dragThreshold = 2;

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
    isDrag: boolean
  } | null = null;

  constructor(
    private selectionManager: SelectionManager,
    backgroundWrapper: BackgroundWrapper,
    dragListeners: DragListeners,
  ) {
    this.backgroundWrapper = backgroundWrapper;

    const that = this;

    dragListeners.onDragStart(ev => that.onClickStart(ev));
    dragListeners.onDragMove(ev => that.onClickMove(ev));
    dragListeners.onDragEnd(ev => that.onClickEnd(ev));
  }

  private onClickStart(event: PIXI.interaction.InteractionEvent): void {
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
      isDrag: false,
    };
  }

  private onClickMove(event: PIXI.interaction.InteractionEvent): void {
    if (this.dragData === null) return;

    const deltaX = event.data.global.x - this.dragData.mouseStart.x;
    const deltaY = event.data.global.y - this.dragData.mouseStart.y;

    if (!this.dragData.isDrag) {
      if (deltaX*deltaX + deltaY*deltaY > BackgroundDragHandler.dragThreshold*BackgroundDragHandler.dragThreshold) {
        this.dragData.isDrag = true;
      }
    }

    if (this.dragData.isDrag) {
      this.backgroundWrapper.setPosition(
        this.dragData.backgroundStart.x + deltaX,
        this.dragData.backgroundStart.y + deltaY,
      );
    }
  }

  private onClickEnd(event: PIXI.interaction.InteractionEvent): void {
    if (this.dragData === null) return;

    if (!this.dragData.isDrag) {
      // clicking on background should clear selection
      this.selectionManager.clearSelection();
    }

    this.dragData = null;
  }
}
