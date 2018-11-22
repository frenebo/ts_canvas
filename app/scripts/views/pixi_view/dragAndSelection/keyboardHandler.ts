import { SelectionManager } from "./selectionManager";
import { ModelChangeRequest } from "../../../interfaces";

export class KeyboardHandler {
  constructor(
    renderer: PIXI.WebGLRenderer | PIXI.CanvasRenderer,
    selectionManager: SelectionManager,
    sendModelChangeRequests: (...reqs: ModelChangeRequest[]) => void,
  ) {
    let mouseIsOverCanvas = false;
    renderer.view.addEventListener("mousemove", () => {
      mouseIsOverCanvas = true;
    });
    renderer.view.addEventListener("mouseout", () => {
      mouseIsOverCanvas = false;
    })
    document.addEventListener("keydown", ev => {
      if (!mouseIsOverCanvas) return;

      if (ev.key === "Delete") selectionManager.deleteSelection();
      if (ev.key === "Escape") selectionManager.clearSelection();
      if (ev.key === "z" && ev.ctrlKey && !ev.shiftKey) {
        sendModelChangeRequests({
          type: "undo",
        });
      }
      if (
        (ev.key === "Z" && ev.ctrlKey) || // capital Z for shift
        (ev.key === "y" && ev.ctrlKey)
      ) {
        sendModelChangeRequests({
          type: "redo",
        });
      }
      if (ev.key === "a" && ev.ctrlKey) selectionManager.selectAll();
    });
  }
}
