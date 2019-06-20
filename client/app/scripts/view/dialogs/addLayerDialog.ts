import {
    RequestInfoFunc,
    RequestModelChangesFunc,
} from "../../messenger.js";
import { Dialog } from "./dialog.js";

/** Class that contains a dialog the user uses to add layers to the graph */
export class AddLayerDialog extends Dialog {
  /**
   * Constructs a layer dialog.
   * @param closeDialogFunc - A function the dialog can call to close itself
   * @param width - The width of the dialog
   * @param height - The height of the dialog
   * @param sendModelInfoRequests - An asynchronous function to request info from the model
   * @param getCursorLoc - A function to get the current location of the cursor
   */
  constructor(
    private readonly closeDialogFunc: () => void,
    width: number,
    height: number,
    private readonly sendModelInfoRequests: RequestInfoFunc,
    private readonly sendModelChangeRequests: RequestModelChangesFunc,
    private readonly getCursorLoc: () => {x: number, y: number},
  ) {
    super(closeDialogFunc, width, height);
    this.root.style.overflowY = "scroll";
    this.init().catch((reason) => {
      throw new Error(`Failed to init: ${reason}`);
    });
  }

  /**
   * Asynchronously initializes the dialog.
   */
  private async init() {
    const saveAsTitle = Dialog.createTitle("Add Layer");
    this.root.appendChild(saveAsTitle);

    this.addLoadIcon();
    const requestData = await this.sendModelInfoRequests<"getListOfLayers">({
        type: "getListOfLayers",
    });
    this.removeLoadIcon();

    const layersDiv = document.createElement("div");
    this.root.appendChild(layersDiv);
    // openFilesDiv.style.height = "80%";
    layersDiv.style.marginLeft = "10px";
    layersDiv.style.marginRight = "10px";

    if (Object.keys(requestData.layers).length === 0) {
      layersDiv.textContent = "No layers available";
      layersDiv.style.textAlign = "center";
      return;
    }

    for (const layerInfo of requestData.layers) {
      const layerRow = document.createElement("div");
      layersDiv.appendChild(layerRow);
      layerRow.style.borderTop = "2px solid black";

      const layerLabel = document.createElement("div");
      layerRow.appendChild(layerLabel);
      layerLabel.textContent = `"${layerInfo.layerType}"`;
      layerLabel.style.height = layerLabel.style.lineHeight = `20px`;
      layerLabel.style.textAlign = "left";
      layerLabel.style.textOverflow = "ellipsis";
      layerLabel.style.overflow = "hidden";
      layerLabel.style.display = "inline-block";

      if (layerInfo.reasonNotAvailable != null) {
        layerLabel.textContent += " Not available: " + layerInfo.reasonNotAvailable;
        layerLabel.style.color = "#606060";
      } else {
        layerLabel.style.cursor = "pointer";

        layerLabel.addEventListener("mouseover", () => {
          layerLabel.style.color = "blue";
        });
        layerLabel.addEventListener("mouseout", () => {
          layerLabel.style.color = "black";
        });

        layerLabel.addEventListener("click", async () => {
          const infoResponse = await this.sendModelInfoRequests<"getUniqueVertexIds">({
            type: "getUniqueVertexIds",
            count: 1,
          });
          const uniqueVtxId = infoResponse.vertexIds[0];

          const cursorLoc: {x: number, y: number} = this.getCursorLoc();
          this.sendModelChangeRequests({
            type: "createLayer",
            layerType: layerInfo.layerType,
            newLayerId: uniqueVtxId,
            x: cursorLoc.x,
            y: cursorLoc.y,
          });
          this.closeDialogFunc();
        });
      }
    }
  }
}
