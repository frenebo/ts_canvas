import { Messenger } from "./messenger.js";
import { Model } from "./model/model.js";
import { View } from "./view/view.js";

export function main(div: HTMLDivElement): void {
  const model = new Model();
  const messenger = new Messenger(model);

  const pixiDiv = document.createElement("div");
  div.appendChild(pixiDiv);
  const layerDiv = document.createElement("div");
  div.appendChild(layerDiv);

  messenger.addView(
    new View(
      pixiDiv,
      messenger.newRequestHandler(),
      messenger.newInfoRequestHandler(),
      messenger.newVersioningRequestHandler(),
    ),
  ).catch((reason) => {
    throw new Error(`Could not add view: ${reason}`);
  });
}
