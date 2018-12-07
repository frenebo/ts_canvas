import { Messenger } from "./messenger.js";
import { DefaultModel } from "./models/default_model/model.js";
import { PixiView } from "./views/pixi_graph_view/view.js";

export function main(...divs: HTMLDivElement[]): void {
  const model = new DefaultModel();
  const messenger = new Messenger(model);

  for (const div of divs) {
    const pixiDiv = document.createElement("div");
    div.appendChild(pixiDiv);
    const layerDiv = document.createElement("div");
    div.appendChild(layerDiv);

    messenger.addView(
      new PixiView(
        pixiDiv,
        messenger.newRequestHandler(),
        messenger.newInfoRequestHandler(),
      ),
    );
  }
}
