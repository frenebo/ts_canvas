import { SelectionManager } from "./selectionManager";
import { ModelChangeRequest, ModelVersioningRequest } from "../../interfaces";

export class KeyboardHandler {
  constructor(
    renderer: PIXI.WebGLRenderer | PIXI.CanvasRenderer,
    selectionManager: SelectionManager,
    sendModelChangeRequests: (...reqs: ModelChangeRequest[]) => void,
    sendModelVersioningRequest: (req: ModelVersioningRequest) => void,
  ) {
    let mouseIsOverCanvas = false;
    renderer.view.addEventListener("mousemove", () => {
      mouseIsOverCanvas = true;
    });
    renderer.view.addEventListener("mouseout", () => {
      mouseIsOverCanvas = false;
    });
    document.addEventListener("keydown", (ev) => {
      if (!mouseIsOverCanvas) return;

      if (ev.key === "Delete") selectionManager.deleteSelection();
      if (ev.key === "Escape") selectionManager.clearSelection();
      if (ev.key === "z" && ev.ctrlKey && !ev.shiftKey) {
        sendModelVersioningRequest({
          type: "undo",
        });
      }
      if (
        (ev.key === "Z" && ev.ctrlKey) || // capital Z for shift
        (ev.key === "y" && ev.ctrlKey)
      ) {
        sendModelVersioningRequest({
          type: "redo",
        });
      }
      if (ev.key === "a" && ev.ctrlKey) selectionManager.selectAll();
    });
  }
}
