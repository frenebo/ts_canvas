import { EdgeWrapper } from "../edgeWrapper.js";
import { DragListeners } from "./dragRegistry.js";
import { SelectionManager } from "./selectionManager.js";

export class EdgeDragHandler {
  private static readonly dragThreshold = 5;

  constructor(
    id: string,
    edgeWrapper: EdgeWrapper,
    listeners: DragListeners,
    selectionManager: SelectionManager,
  ) {
    let clickData: {
      isCtrlClick: boolean;
      mouseStartLocal: {
        x: number;
        y: number;
      };
      isDrag: boolean;
    } | null = null;

    listeners.onDragStart((event) => {
      if (clickData !== null) throw new Error("click already in progress");
      const mouseLocalX = edgeWrapper.getDataRelativeLoc(event.data).x - edgeWrapper.localX();
      const mouseLocalY = edgeWrapper.getDataRelativeLoc(event.data).y - edgeWrapper.localY();

      clickData = {
        isCtrlClick: event.data.originalEvent.ctrlKey,
        mouseStartLocal: {
          x: mouseLocalX,
          y: mouseLocalY,
        },
        isDrag: false,
      };

      if (!selectionManager.edgeIsSelected(id) && !clickData.isCtrlClick) {
        selectionManager.clearSelection();
      }
      selectionManager.selectEdge(id);
    });
    listeners.onDragMove((event) => {
      if (clickData === null) throw new Error("no click in progress");

      const mouseLocalX = edgeWrapper.getDataRelativeLoc(event.data).x - edgeWrapper.localX();
      const mouseLocalY = edgeWrapper.getDataRelativeLoc(event.data).y - edgeWrapper.localY();

      const dx = mouseLocalX - clickData.mouseStartLocal.x;
      const dy = mouseLocalY - clickData.mouseStartLocal.y;


      // If the current click doesn't count as a drag
      if (!clickData.isDrag) {


        if (dx*dx + dy*dy > EdgeDragHandler.dragThreshold*EdgeDragHandler.dragThreshold) {
          // begin drag
          clickData.isDrag = true;
          selectionManager.startSelectionDrag(dx, dy, clickData.isCtrlClick);
        }
      }

      if (clickData.isDrag) {
        selectionManager.continueSelectionDrag(dx, dy);
      }
    });
    listeners.onDragEnd((event) => {
      if (clickData === null) throw new Error("no click in progress");

      const mouseLocalX = edgeWrapper.getDataRelativeLoc(event.data).x - edgeWrapper.localX();
      const mouseLocalY = edgeWrapper.getDataRelativeLoc(event.data).y - edgeWrapper.localY();

      const dx = mouseLocalX - clickData.mouseStartLocal.x;
      const dy = mouseLocalY - clickData.mouseStartLocal.y;

      if (clickData.isDrag) {
        selectionManager.endSelectionDrag(dx, dy);
      } else {
        if (!clickData.isCtrlClick) {
          selectionManager.clearSelection();
          selectionManager.selectEdge(id);
        }
      }

      clickData = null;
    });
    listeners.onDragAbort(() => {
      if (clickData === null) return;

      if (clickData.isDrag) {
        selectionManager.abortSelectionDrag();
      }
      clickData = null;
    });
  }
}
