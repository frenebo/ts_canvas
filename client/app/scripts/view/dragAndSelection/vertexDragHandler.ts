import { VertexWrapper } from "../graphicWrappers/vertexWrapper.js";
import { SelectionManager } from "../selectionManager.js";
import { StageInterface } from "../stageInterface.js";
import { IDragListenerAdder } from "./dragRegistry.js";

export class VertexDragHandler {
  private static readonly dragThreshold = 5;

  private clickData: null | {
    mouseStartLocal: {
      x: number;
      y: number;
    };
    isCtrlOrMetaClick: boolean;
    isDrag: boolean;
    selectionUpdated: boolean;
    // dragData: {
    //   ghost: PIXI.Graphics;
    // } | null;
  } = null;

  constructor(
    private readonly vertexId: string,
    private readonly vtxWrapper: VertexWrapper,
    listeners: IDragListenerAdder,
    private readonly selectionManager: SelectionManager,
    private readonly stageInterface: StageInterface,
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
    if (this.clickData !== null) {
      throw new Error("Click already in progress");
    }

    const mouseLocalX = this.vtxWrapper.getDataRelativeLoc(event.data).x - this.vtxWrapper.localX();
    const mouseLocalY = this.vtxWrapper.getDataRelativeLoc(event.data).y - this.vtxWrapper.localY();

    const ctrlOrMetaDown = event.data.originalEvent.ctrlKey || event.data.originalEvent.metaKey;

    this.clickData = {
      isCtrlOrMetaClick: ctrlOrMetaDown,
      isDrag: false,
      mouseStartLocal: {
        x: mouseLocalX,
        y: mouseLocalY,
      },
      selectionUpdated: false,
    };

    if (!this.selectionManager.vertexIsSelected(this.vertexId) && !this.clickData.isCtrlOrMetaClick) {
      this.selectionManager.clearSelection();
    }

    if (!this.clickData.isCtrlOrMetaClick || !this.selectionManager.vertexIsSelected(this.vertexId)) {
      this.selectionManager.selectVertex(this.vertexId);
      this.clickData.selectionUpdated = true;
    }
  }

  private continueClick(event: PIXI.interaction.InteractionEvent): void {
    if (this.clickData === null) {
      throw new Error("No click in progress");
    }

    const mouseLocalX = this.vtxWrapper.getDataRelativeLoc(event.data).x - this.vtxWrapper.localX();
    const mouseLocalY = this.vtxWrapper.getDataRelativeLoc(event.data).y - this.vtxWrapper.localY();

    const dx = mouseLocalX - this.clickData.mouseStartLocal.x;
    const dy = mouseLocalY - this.clickData.mouseStartLocal.y;

    // If the current click doesn't count as a drag
    if (!this.clickData.isDrag && this.selectionManager.vertexIsSelected(this.vertexId)) {

      const scaledThreshold = VertexDragHandler.dragThreshold / this.stageInterface.getScale();
      if (dx * dx + dy * dy > scaledThreshold * scaledThreshold) {
        // begin drag
        this.clickData.isDrag = true;
        this.selectionManager.startSelectionDrag(dx, dy, this.clickData.isCtrlOrMetaClick);
      }
    }

    if (this.clickData.isDrag) {
      this.selectionManager.continueSelectionDrag(dx, dy);
    }
  }

  private endClick(event: PIXI.interaction.InteractionEvent): void {
    if (this.clickData === null) {
      throw new Error("No click in progress");
    }

    const mouseLocalX = this.vtxWrapper.getDataRelativeLoc(event.data).x - this.vtxWrapper.localX();
    const mouseLocalY = this.vtxWrapper.getDataRelativeLoc(event.data).y - this.vtxWrapper.localY();

    const dx = mouseLocalX - this.clickData.mouseStartLocal.x;
    const dy = mouseLocalY - this.clickData.mouseStartLocal.y;

    if (this.clickData.isDrag) {
      this.selectionManager.endSelectionDrag(dx, dy).catch(() => {
        // @TODO
      });
    } else if (!this.clickData.selectionUpdated) {
      if (this.clickData.isCtrlOrMetaClick) {
        if (this.selectionManager.vertexIsSelected(this.vertexId)) {
          this.selectionManager.deselectVertex(this.vertexId);
        } else {
          this.selectionManager.selectVertex(this.vertexId);
        }
      } else {
        this.selectionManager.clearSelection();
        this.selectionManager.selectVertex(this.vertexId);
      }
    }

    this.clickData = null;
  }

  private abortClick() {
    if (this.clickData === null) {
      return;
    }

    if (this.clickData.isDrag) {
      this.selectionManager.abortSelectionDrag();
    }
  }
}
