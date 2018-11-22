import { VertexWrapper } from "../vertexWrapper.js";
import { DragListeners } from "./dragRegistry.js";
import { SelectionManager } from "./selectionManager.js";

export class VertexDragHandler {
  private static readonly dragThreshold = 5;

  private clickData: null | {
    mouseStartLocal: {
      x: number;
      y: number;
    };
    isCtrlClick: boolean;
    isDrag: boolean;
    // dragData: {
    //   ghost: PIXI.Graphics;
    // } | null;
  } = null;

  constructor(
    private readonly vertexId: string,
    private readonly vtxWrapper: VertexWrapper,
    listeners: DragListeners,
    private readonly selectionManager: SelectionManager,
  ) {
    const that = this;

    listeners.onDragStart((ev) => {
      that.beginClick(ev);
    });
    listeners.onDragMove((ev) => {
      that.continueClick(ev);
    });
    listeners.onDragEnd((ev) => {
      that.endClick(ev);
    });
    listeners.onDragAbort(() => {
      that.abortClick();
    });
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
      isDrag: false,
      // dragData: null,
    };

    if (!this.selectionManager.vertexIsSelected(this.vertexId) && !this.clickData.isCtrlClick) {
      this.selectionManager.clearSelection();

      // this.selectionManager.selectVertex(this.vtxWrapper);
    }

    this.selectionManager.selectVertex(this.vertexId);
  }

  private continueClick(event: PIXI.interaction.InteractionEvent): void {
    if (this.clickData === null) throw new Error("No click in progress");
    const mouseLocalX = this.vtxWrapper.getDataRelativeLoc(event.data).x - this.vtxWrapper.localX();
    const mouseLocalY = this.vtxWrapper.getDataRelativeLoc(event.data).y - this.vtxWrapper.localY();

    const dx = mouseLocalX - this.clickData.mouseStartLocal.x;
    const dy = mouseLocalY - this.clickData.mouseStartLocal.y;


    // If the current click doesn't count as a drag
    if (!this.clickData.isDrag) {


      if (dx*dx + dy*dy > VertexDragHandler.dragThreshold*VertexDragHandler.dragThreshold) {
        // begin drag
        this.clickData.isDrag = true;
        this.selectionManager.startSelectionDrag(dx, dy, this.clickData.isCtrlClick);
      }
    }

    if (this.clickData.isDrag) {
      this.selectionManager.continueSelectionDrag(dx, dy);
    }
  }

  private endClick(event: PIXI.interaction.InteractionEvent): void {
    if (this.clickData === null) throw new Error("No click in progress");

    const mouseLocalX = this.vtxWrapper.getDataRelativeLoc(event.data).x - this.vtxWrapper.localX();
    const mouseLocalY = this.vtxWrapper.getDataRelativeLoc(event.data).y - this.vtxWrapper.localY();

    const dx = mouseLocalX - this.clickData.mouseStartLocal.x;
    const dy = mouseLocalY - this.clickData.mouseStartLocal.y;

    if (this.clickData.isDrag) {
      this.selectionManager.endSelectionDrag(dx, dy);
    } else {
      if (!this.clickData.isCtrlClick) {
        this.selectionManager.clearSelection();
        this.selectionManager.selectVertex(this.vertexId);
      }
    }

    this.clickData = null;
  }

  private abortClick() {
    if (this.clickData === null) return;

    if (this.clickData.isDrag) {
      this.selectionManager.abortSelectionDrag();
    }
  }
}
