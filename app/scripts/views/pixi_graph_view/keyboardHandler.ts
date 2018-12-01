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

      let isViewKey = true;
      if (ev.key === "Delete") {
        selectionManager.deleteSelection();
      } else if (ev.key === "Escape") {
        selectionManager.clearSelection();
      } else if (ev.key === "z" && ev.ctrlKey && !ev.shiftKey) {
        sendModelVersioningRequest({
          type: "undo",
        });
      } else if (
        (ev.key === "Z" && ev.ctrlKey) || // capital Z for shift
        (ev.key === "y" && ev.ctrlKey)
      ) {
        sendModelVersioningRequest({
          type: "redo",
        });
      } else if (ev.key === "a" && ev.ctrlKey) {
        selectionManager.selectAll();
      } else if (ev.key === "g" && ev.shiftKey) {
        console.log("TODO: group");
      } else {
        isViewKey = false;
      }

      if (isViewKey) {
        ev.preventDefault();
      }
    });
  }
}
