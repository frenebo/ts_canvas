import { EdgeWrapper } from "../graphicWrappers/edgeWrapper.js";
import { SelectionManager } from "../selectionManager.js";
import { StageInterface } from "../stageInterface.js";
import { IDragListeners } from "./dragRegistry.js";

export class EdgeDragHandler {
  private static readonly dragThreshold = 5;

  constructor(
    id: string,
    edgeWrapper: EdgeWrapper,
    listeners: IDragListeners,
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

    listeners.onDragStart((event) => {
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
    listeners.onDragMove((event) => {
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
    listeners.onDragEnd((event) => {
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
    listeners.onDragAbort(() => {
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
