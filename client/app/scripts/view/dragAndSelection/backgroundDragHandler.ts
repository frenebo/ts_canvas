import { BackgroundWrapper } from "../graphicWrappers/backgroundWrapper.js";
import { SelectionManager } from "../selectionManager.js";
import { StageInterface } from "../stageInterface.js";
import { IDragListenerAdder as IDragListenerAdder } from "./dragRegistry.js";

/** Class for monitoring and responding to the clicking and dragging of the graph background */
export class BackgroundDragHandler {
  private static readonly dragThreshold = 2;

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

  /**
   * Constructs a background drag handler
   * @param selectionManager - The selection manager the background drag handler uses
   * @param stageInterface - The StageInterface the background drag handler uses
   * @param dragListenerAdder - An object with listeners for the background drag handler to call upon different events
   */
  constructor(
    private readonly selectionManager: SelectionManager,
    private readonly stageInterface: StageInterface,
    dragListenerAdder: IDragListenerAdder,
  ) {
    const that = this;

    dragListenerAdder.onDragStart((ev) => { that.onClickStart(ev); });
    dragListenerAdder.onDragMove((ev) => { that.onClickMove(ev); });
    dragListenerAdder.onDragEnd((ev) => { that.onClickEnd(ev); });
    dragListenerAdder.onDragAbort(() => { that.onClickAbort(); });
  }

  /**
   * Takes a given click start event and makes necessary changes to current mouse data, selection manager, etc.
   * @param event - The PIXI interaction event
   */
  private onClickStart(event: PIXI.interaction.InteractionEvent): void {
    if (this.mouseData !== null) {
      throw new Error("Previous drag has not ended");
    }

    // if the event is from a mouse AND its button is the left mouse button
    // AND the control key is not clicked, clicking on the background clears selection
    if (
      (event.data.originalEvent as MouseEvent).button === 0 &&
      !event.data.originalEvent.ctrlKey &&
      !event.data.originalEvent.metaKey
    ) {
      this.selectionManager.clearSelection();
    }
    const mouseStart = {
      x: event.data.global.x,
      y: event.data.global.y,
    };

    const backgroundStart = {
      x: this.stageInterface.getStageX(),
      y: this.stageInterface.getStageY(),
    };

    if (event.data.originalEvent.ctrlKey || event.data.originalEvent.metaKey) {
      const graphics = new PIXI.Graphics();
      this.stageInterface.addDisplayObject(graphics);

      const mouseStartLocal = {
        x: this.stageInterface.getDataRelativeLoc(event.data).x,
        y: this.stageInterface.getDataRelativeLoc(event.data).y,
      };

      this.mouseData = {
        graphics: graphics,
        mouseStart,
        mouseStartLocal,
        type: "select",
      };
    } else {
      this.mouseData = {
        backgroundStart,
        mouseStart,
        type: "click",
      };
    }
  }

  /**
   * Takes a given click move event and makes necessary changes to current mouse data, selection manager, etc.
   * @param event - The PIXI interaction event
   */
  private onClickMove(event: PIXI.interaction.InteractionEvent): void {
    if (this.mouseData === null) {
      return;
    }

    const deltaX = event.data.global.x - this.mouseData.mouseStart.x;
    const deltaY = event.data.global.y - this.mouseData.mouseStart.y;

    if (this.mouseData.type === "click") {
      if (
        deltaX * deltaX + deltaY * deltaY > BackgroundDragHandler.dragThreshold * BackgroundDragHandler.dragThreshold
      ) {
        this.mouseData = {
          backgroundStart: this.mouseData.backgroundStart,
          mouseStart: this.mouseData.mouseStart,
          type: "drag",
        };
      }
    }

    if (this.mouseData.type === "click") {
      // do nothing
    } else if (this.mouseData.type === "drag") {
      this.stageInterface.setStagePositionAbsolute(
        this.mouseData.backgroundStart.x + deltaX,
        this.mouseData.backgroundStart.y + deltaY,
      );
    } else if (this.mouseData.type === "select") {
      const graphics = this.mouseData.graphics;

      const mouseLocalPos = this.stageInterface.getDataRelativeLoc(event.data);

      graphics.clear();
      graphics.lineColor = 0x000000;
      graphics.beginFill(0x000000, 0.2);
      graphics.lineStyle(2);
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

  /**
   * Takes a given click end event and makes necessary changes to current mouse data, selection manager, etc.
   * @param event - The PIXI interaction event
   */
  private onClickEnd(event: PIXI.interaction.InteractionEvent): void {
    if (this.mouseData === null) {
      return;
    }

    if (this.mouseData.type === "select") {
      this.stageInterface.removeDisplayObject(this.mouseData.graphics);

      const mouseLocalPos = this.stageInterface.getDataRelativeLoc(event.data);

      this.selectionManager.addSelectionBox(
        Math.min(this.mouseData.mouseStartLocal.x, mouseLocalPos.x),
        Math.min(this.mouseData.mouseStartLocal.y, mouseLocalPos.y),
        Math.abs(this.mouseData.mouseStartLocal.x - mouseLocalPos.x),
        Math.abs(this.mouseData.mouseStartLocal.y - mouseLocalPos.y),
      );
    }

    this.mouseData = null;
  }

  /**
   * Takes a given click abort and makes necessary changes to current mouse data, selection manager, etc.
   */
  private onClickAbort(): void {
    if (this.mouseData === null) {
      return;
    }

    if (this.mouseData.type === "select") {
      this.stageInterface.removeDisplayObject(this.mouseData.graphics);
    }

    this.mouseData = null;
  }
}
