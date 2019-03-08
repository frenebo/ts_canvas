import {
    RequestInfoFunc,
} from "../../messenger.js";
import { Dialog } from "./dialog.js";

export class AddLayerDialog extends Dialog {
  constructor(
    private readonly closeDialogFunc: () => void,
    width: number,
    height: number,
    private readonly sendModelInfoRequests: RequestInfoFunc,
  ) {
    super(closeDialogFunc, width, height);
    this.root.style.overflowY = "scroll";
    this.init().catch((reason) => {
      throw new Error(`Failed to init: ${reason}`);
    });
  }

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
      layerLabel.textContent = `"${layerInfo.layerName}"`;
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
          alert("Unimplemented");
          this.closeDialogFunc();
        });
      }
    }
  }
}
