import { createMessenger } from "./messenger.js";
import { View } from "./view/view.js";

/**
 * Sets up the view and interface with server, puts view in the given div.
 * @param div - The div for everything to go in
 */
export async function main(div: HTMLDivElement): Promise<void> {
  const messenger = await createMessenger();
  const pixiDiv = document.createElement("div");
  div.appendChild(pixiDiv);
  // const layerDiv = document.createElement("div");
  // div.appendChild(layerDiv);

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
