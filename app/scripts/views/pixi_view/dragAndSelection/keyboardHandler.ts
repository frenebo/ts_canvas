import { SelectionManager } from "./selectionManager";

export class KeyboardHandler {
  constructor(
    renderer: PIXI.WebGLRenderer | PIXI.CanvasRenderer,
    selectionManager: SelectionManager,
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
    });
  }
}
