import { Messenger } from "./messenger.js";
import { DefaultModel } from "./models/default_model/model.js";
import { PixiView } from "./views/pixi_view/view.js";

export function main(div: HTMLDivElement): void {
  if (!(div instanceof HTMLDivElement)) {
    throw new Error("Could not verify that div is an HTMLDivElement");
  }

  const model = new DefaultModel;
  const messenger = new Messenger(model);
  messenger.addView(new PixiView(div, messenger.newRequestHandler(), messenger.newInfoRequestHandler()));
}
