import { VertexWrapper } from "../graphicWrappers/vertexWrapper.js";
import { SelectionManager } from "../selectionManager.js";
import { StageInterface } from "../stageInterface.js";
import { IDragListenerAdder } from "./dragRegistry.js";

/** Class for monitoring and keeping track of the clicking and dragging of a vertex */
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
  } = null;

  /**
   * Constructs a vertex drag handler.
   * @param vertexId - The id of the vertex
   * @param vtxWrapper -  The vertex wrapper
   * @param listenerAdder - The listener adder for the vertex's events
   * @param selectionManager - The selection manager for the graph
   * @param stageInterface - The stage interface for the graph
   */
  constructor(
    private readonly vertexId: string,
    private readonly vtxWrapper: VertexWrapper,
    listenerAdder: IDragListenerAdder,
    private readonly selectionManager: SelectionManager,
    private readonly stageInterface: StageInterface,
  ) {
    const that = this;

    listenerAdder.onDragStart((ev) => {
      that.beginClick(ev);
    });
    listenerAdder.onDragMove((ev) => {
      that.continueClick(ev);
    });
    listenerAdder.onDragEnd((ev) => {
      that.endClick(ev);
    });
    listenerAdder.onDragAbort(() => {
      that.abortClick();
    });
  }

  /**
   * Initiates the start of a click.
   * @param event - The PIXI interaction event for the click start
   */
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

  /**
   * Continues a click on the vertex.
   * @param event - The PIXI interaction event for the click continuation
   */
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

  /**
   * Ends a click on the vertex.
   * @param event - The PIXI interaction event for the click end
   */
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

  /**
   * Aborts a click on the vertex.
   */
  private abortClick() {
    if (this.clickData === null) {
      return;
    }

    if (this.clickData.isDrag) {
      this.selectionManager.abortSelectionDrag();
    }
  }
}
