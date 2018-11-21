import { VertexWrapper } from "../vertexWrapper.js";
import { DragListeners } from "./dragRegistry.js";
import { SelectionManager } from "./selectionManager.js";

export class VertexDragHandler {
  private static ghostAlpha = 0.5;
  private static dragThreshold = 5;

  private clickData: null | {
    mouseStartLocal: {
      x: number;
      y: number;
    };
    isCtrlClick: boolean;
    dragData: {
      ghost: PIXI.Graphics;
    } | null;
  } = null;

  private dragListeners: Array<(x: number, y: number, ctrlKey: boolean) => void> = [];

  constructor(
    private vtxWrapper: VertexWrapper,
    listeners: DragListeners,
    private selectionManager: SelectionManager,
  ) {
    const that = this;

    listeners.onDragStart(ev => that.beginClick(ev));
    listeners.onDragMove(ev => that.continueClick(ev));
    listeners.onDragEnd(ev => that.endClick(ev));
  }

  public afterDrag(listener: (x: number, y: number, ctrlKey: boolean) => void): void {
    this.dragListeners.push(listener);
  }

  private beginClick(event: PIXI.interaction.InteractionEvent): void {
    if (this.clickData !== null) throw new Error("Click already in progress");

    const mouseLocalX = this.vtxWrapper.getDataRelativeLoc(event.data).x - this.vtxWrapper.localX();
    const mouseLocalY = this.vtxWrapper.getDataRelativeLoc(event.data).y - this.vtxWrapper.localY();

    const ctrlKeyDown = event.data.originalEvent.ctrlKey;

    this.clickData = {
      mouseStartLocal: {
        x: mouseLocalX,
        y: mouseLocalY,
      },
      isCtrlClick: ctrlKeyDown,
      dragData: null,
    };

    if (!ctrlKeyDown) this.selectionManager.clearSelection();

    this.selectionManager.selectVertex(this.vtxWrapper);
  }

  private continueClick(event: PIXI.interaction.InteractionEvent): void {
    if (this.clickData === null) throw new Error("No click in progress");
    const mouseLocalX = this.vtxWrapper.getDataRelativeLoc(event.data).x - this.vtxWrapper.localX();
    const mouseLocalY = this.vtxWrapper.getDataRelativeLoc(event.data).y - this.vtxWrapper.localY();

    const dx = mouseLocalX - this.clickData.mouseStartLocal.x;
    const dy = mouseLocalY - this.clickData.mouseStartLocal.y;

    // If the current click doesn't count as a drag
    if (this.clickData.dragData === null) {


      if (dx*dx + dy*dy > VertexDragHandler.dragThreshold*VertexDragHandler.dragThreshold) {
        // begin drag
        this.clickData.dragData = {
          ghost: VertexWrapper.generateBoxGraphics(VertexDragHandler.ghostAlpha),
        };
        this.vtxWrapper.addChild(this.clickData.dragData.ghost);
      }
    }

    if (this.clickData.dragData !== null) {
      this.clickData.dragData.ghost.position.set(dx, dy);
    }
  }

  private endClick(event: PIXI.interaction.InteractionEvent): void {
    if (this.clickData === null) throw new Error("No click in progress");

    if (this.clickData.dragData !== null) {
      this.vtxWrapper.removeChild(this.clickData.dragData.ghost);

      const newVertexX = this.vtxWrapper.getDataRelativeLoc(event.data).x - this.clickData.mouseStartLocal.x;
      const newVertexY = this.vtxWrapper.getDataRelativeLoc(event.data).y - this.clickData.mouseStartLocal.y;

      for (const listener of this.dragListeners) {
        listener(newVertexX, newVertexY, this.clickData.isCtrlClick);
      }
    }

    this.clickData = null;
  }

  // private beginDrag(event: PIXI.interaction.InteractionEvent): void {
  //   if (this.oldDragData !== null) throw new Error("Previous drag has not ended");
  //
  //   const dragOutline = VertexWrapper.generateBoxGraphics(VertexDragHandler.ghostAlpha);
  //   this.vtxWrapper.addChild(dragOutline);
  //
  //   this.oldDragData = {
  //     mouseLocalPos: {
  //       x: this.vtxWrapper.getDataRelativeLoc(event.data).x - this.vtxWrapper.localX(),
  //       y: this.vtxWrapper.getDataRelativeLoc(event.data).y - this.vtxWrapper.localY(),
  //     },
  //     dragOutline: dragOutline,
  //     isCtrlDrag: event.data.originalEvent.ctrlKey,
  //   };
  // }
  //
  // private endDrag(event: PIXI.interaction.InteractionEvent): void {
  //   if (this.oldDragData === null) return;
  //
  //   this.vtxWrapper.removeChild(this.oldDragData.dragOutline);
  //
  //   const newVertexX = this.vtxWrapper.getDataRelativeLoc(event.data).x - this.oldDragData.mouseLocalPos.x;
  //   const newVertexY = this.vtxWrapper.getDataRelativeLoc(event.data).y - this.oldDragData.mouseLocalPos.y;
  //
  //   for (const listener of this.dragListeners) {
  //     listener(newVertexX, newVertexY, this.oldDragData.isCtrlDrag);
  //   }
  //
  //   this.oldDragData = null;
  // }
  //
  // private continueDrag(event: PIXI.interaction.InteractionEvent): void {
  //   if (this.oldDragData === null) return;
  //
  //   const relativeX = (this.vtxWrapper.getDataRelativeLoc(event.data).x - this.oldDragData.mouseLocalPos.x) - this.vtxWrapper.localX();
  //   const relativeY = (this.vtxWrapper.getDataRelativeLoc(event.data).y - this.oldDragData.mouseLocalPos.y) - this.vtxWrapper.localY();
  //
  //   this.oldDragData.dragOutline.position.set(relativeX, relativeY);
  // }
}
