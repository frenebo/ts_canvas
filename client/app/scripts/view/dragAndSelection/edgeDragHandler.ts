import { EdgeWrapper } from "../graphicWrappers/edgeWrapper.js";
import { SelectionManager } from "../selectionManager.js";
import { StageInterface } from "../stageInterface.js";
import { IDragListenerAdder } from "./dragRegistry.js";

/** Class for keeping track of and responding to the click events for an edge */
export class EdgeDragHandler {
  private static readonly dragThreshold = 5;

  /**
   * Constructs an edge drag handler.
   * @param id - The id of the edge
   * @param edgeWrapper - The edge wrapper
   * @param listenerAdder - The listener adder for adding event listeners to
   * @param selectionManager - The selection manager to call when edge is clicked
   * @param stageInterface - The stage interface to get information from
   */
  constructor(
    id: string,
    edgeWrapper: EdgeWrapper,
    listenerAdder: IDragListenerAdder,
    selectionManager: SelectionManager,
    private readonly stageInterface: StageInterface,
  ) {
    let clickData: {
      isCtrlOrMetaClick: boolean;
      mouseStartLocal: {
        x: number;
        y: number;
      };
      isDrag: boolean;
      selectionUpdated: boolean;
    } | null = null;

    listenerAdder.onDragStart((event) => {
      if (clickData !== null) {
        throw new Error("click already in progress");
      }

      const mouseLocalX = edgeWrapper.getDataRelativeLoc(event.data).x - edgeWrapper.localX();
      const mouseLocalY = edgeWrapper.getDataRelativeLoc(event.data).y - edgeWrapper.localY();

      clickData = {
        isCtrlOrMetaClick: event.data.originalEvent.ctrlKey || event.data.originalEvent.metaKey,
        isDrag: false,
        mouseStartLocal: {
          x: mouseLocalX,
          y: mouseLocalY,
        },
        selectionUpdated: false,
      };

      if (!selectionManager.edgeIsSelected(id) && !clickData.isCtrlOrMetaClick) {
        selectionManager.clearSelection();
      }

      if (!clickData.isCtrlOrMetaClick || !selectionManager.edgeIsSelected(id)) {
        selectionManager.selectEdge(id);
        clickData.selectionUpdated = true;
      }
    });
    
    listenerAdder.onDragMove((event) => {
      if (clickData === null) {
        throw new Error("no click in progress");
      }

      const mouseLocalX = edgeWrapper.getDataRelativeLoc(event.data).x - edgeWrapper.localX();
      const mouseLocalY = edgeWrapper.getDataRelativeLoc(event.data).y - edgeWrapper.localY();

      const dx = mouseLocalX - clickData.mouseStartLocal.x;
      const dy = mouseLocalY - clickData.mouseStartLocal.y;

      // If the current click doesn't count as a drag
      if (!clickData.isDrag && selectionManager.edgeIsSelected(id)) {
        const scaledThreshold = EdgeDragHandler.dragThreshold / this.stageInterface.getScale();
        if (dx * dx + dy * dy > scaledThreshold * scaledThreshold) {
          // begin drag
          clickData.isDrag = true;
          selectionManager.startSelectionDrag(dx, dy, clickData.isCtrlOrMetaClick);
        }
      }

      if (clickData.isDrag) {
        selectionManager.continueSelectionDrag(dx, dy);
      }
    });
    
    listenerAdder.onDragEnd((event) => {
      if (clickData === null) {
        throw new Error("no click in progress");
      }

      const mouseLocalX = edgeWrapper.getDataRelativeLoc(event.data).x - edgeWrapper.localX();
      const mouseLocalY = edgeWrapper.getDataRelativeLoc(event.data).y - edgeWrapper.localY();

      const dx = mouseLocalX - clickData.mouseStartLocal.x;
      const dy = mouseLocalY - clickData.mouseStartLocal.y;

      if (clickData.isDrag) {
        selectionManager.endSelectionDrag(dx, dy).catch(() => {
          // @TODO
        });
      } else if (!clickData.selectionUpdated) {
        if (clickData.isCtrlOrMetaClick) {
          if (selectionManager.edgeIsSelected(id)) {
            selectionManager.deselectEdge(id);
          } else {
            selectionManager.selectEdge(id);
          }
        } else {
          selectionManager.clearSelection();
          selectionManager.selectEdge(id);
        }
      }

      clickData = null;
    });
    
    listenerAdder.onDragAbort(() => {
      if (clickData === null) {
        return;
      }

      if (clickData.isDrag) {
        selectionManager.abortSelectionDrag();
      }
      clickData = null;
    });
  }
}
