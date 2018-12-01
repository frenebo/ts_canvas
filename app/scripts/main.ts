import { Messenger } from "./messenger.js";
import { DefaultModel } from "./models/default_model/model.js";
import { PixiView } from "./views/pixi_graph_view/view.js";
import { DefaultLayerEditView } from "./views/layer_edit_view/layerEditView.js";

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
        messenger.newVersioningRequestHandler(),
      ),
    );
    messenger.addView(
      new DefaultLayerEditView(
        layerDiv,
      ),
    );
  }
}
