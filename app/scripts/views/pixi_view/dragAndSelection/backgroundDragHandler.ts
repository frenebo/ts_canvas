import { BackgroundWrapper } from "../backgroundWrapper.js";
import { DragListeners } from "./dragRegistry.js";
import { SelectionManager } from "./selectionManager.js";

export class BackgroundDragHandler {
  private static dragThreshold = 2;

  private backgroundWrapper: BackgroundWrapper;
  private mouseData: {
    type: "click";
    mouseStart: {
      x: number;
      y: number;
    };
    backgroundStart: {
      x: number;
      y: number;
    };
  } | {
    type: "drag";
    mouseStart: {
      x: number;
      y: number;
    };
    backgroundStart: {
      x: number;
      y: number;
    };
  } | {
    type: "select";
    mouseStart: {
      x: number;
      y: number;
    };
    mouseStartLocal: {
      x: number;
      y: number;
    };
    graphics: PIXI.Graphics;
  }| null = null;

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
    dragListeners.onDragAbort(() => that.onClickAbort());
  }

  private onClickStart(event: PIXI.interaction.InteractionEvent): void {
    if (this.mouseData !== null) throw new Error("Previous drag has not ended");

    // if the event is from a mouse AND its button is the left mouse button
    // AND the control key is not clicked, clicking on the background clears selection
    if ((event.data.originalEvent as MouseEvent).button === 0 && !event.data.originalEvent.ctrlKey) {
      this.selectionManager.clearSelection();
    }
    const mouseStart = {
      x: event.data.global.x,
      y: event.data.global.y,
    };

    const backgroundStart = {
      x: this.backgroundWrapper.localX(),
      y: this.backgroundWrapper.localY(),
    };

    if (event.data.originalEvent.ctrlKey) {
      const graphics = new PIXI.Graphics();
      this.backgroundWrapper.addChild(graphics);

      const mouseStartLocal = {
        x: this.backgroundWrapper.getDataRelativeLoc(event.data).x,
        y: this.backgroundWrapper.getDataRelativeLoc(event.data).y,
      }

      this.mouseData = {
        type: "select",
        mouseStart,
        mouseStartLocal,
        // backgroundStart,
        graphics: graphics,
      };
    } else {
      this.mouseData = {
        type: "click",
        mouseStart,
        backgroundStart,
      };
    }
  }

  private onClickMove(event: PIXI.interaction.InteractionEvent): void {
    if (this.mouseData === null) return;

    const deltaX = event.data.global.x - this.mouseData.mouseStart.x;
    const deltaY = event.data.global.y - this.mouseData.mouseStart.y;

    if (this.mouseData.type === "click") {
      if (deltaX*deltaX + deltaY*deltaY > BackgroundDragHandler.dragThreshold*BackgroundDragHandler.dragThreshold) {
        this.mouseData = {
          type: "drag",
          mouseStart: this.mouseData.mouseStart,
          backgroundStart: this.mouseData.backgroundStart,
        };
      }
    }

    if (this.mouseData.type === "click") {
      // do nothing
    } else if (this.mouseData.type === "drag") {
      this.backgroundWrapper.setPosition(
        this.mouseData.backgroundStart.x + deltaX,
        this.mouseData.backgroundStart.y + deltaY,
      );
    } else if (this.mouseData.type === "select") {
      const graphics = this.mouseData.graphics;

      const mouseLocalPos = this.backgroundWrapper.getDataRelativeLoc(event.data);

      graphics.clear();
      graphics.lineColor = 0x000000;
      graphics.beginFill(0x000000, 0.2);
      graphics.lineWidth = 2;
      // graphics.position.set(
      // );
      graphics.drawRect(
        Math.min(this.mouseData.mouseStartLocal.x, mouseLocalPos.x),
        Math.min(this.mouseData.mouseStartLocal.y, mouseLocalPos.y),
        Math.abs(this.mouseData.mouseStartLocal.x - mouseLocalPos.x),
        Math.abs(this.mouseData.mouseStartLocal.y - mouseLocalPos.y),
      );
    }
  }

  private onClickEnd(event: PIXI.interaction.InteractionEvent): void {
    if (this.mouseData === null) return;

    if (this.mouseData.type === "select") {
      this.backgroundWrapper.removeChild(this.mouseData.graphics);

      const mouseLocalPos = this.backgroundWrapper.getDataRelativeLoc(event.data);

      this.selectionManager.addSelectionBox(
        Math.min(this.mouseData.mouseStartLocal.x, mouseLocalPos.x),
        Math.min(this.mouseData.mouseStartLocal.y, mouseLocalPos.y),
        Math.abs(this.mouseData.mouseStartLocal.x - mouseLocalPos.x),
        Math.abs(this.mouseData.mouseStartLocal.y - mouseLocalPos.y),
      )
    }

    this.mouseData = null;
  }

  private onClickAbort(): void {
    if (this.mouseData === null) return;

    if (this.mouseData.type === "select") {
      this.backgroundWrapper.removeChild(this.mouseData.graphics);
    }

    this.mouseData = null;
  }
}
