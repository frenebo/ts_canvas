import { Dialog } from "./dialog.js";
import { RequestModelChangesFunc, RequestInfoFunc, RequestVersioningChangeFunc } from "../../../messenger.js";

export class OpenDialog extends Dialog {
  constructor(
    private readonly closeDialogFunc: () => void,
    width: number,
    height: number,
    private readonly sendModelInfoRequests: RequestInfoFunc,
    private readonly sendModelVersioningRequest: RequestVersioningChangeFunc,
  ) {
    super(closeDialogFunc, width, height);
    this.root.style.overflowY = "scroll";
    this.init();
  }

  private async init() {
    const saveAsTitle = Dialog.createTitle("Open");
    this.root.appendChild(saveAsTitle);

    this.addLoadIcon();
    const requestData = await this.sendModelInfoRequests<"savedFileNames">({
      type: "savedFileNames",
    });
    this.removeLoadIcon();
    const fileNames = requestData.fileNames;

    const openFilesDiv = document.createElement("div");
    this.root.appendChild(openFilesDiv);
    // openFilesDiv.style.height = "80%";
    openFilesDiv.style.marginLeft = "10px";
    openFilesDiv.style.marginRight = "10px";

    if (fileNames.length === 0) {
      openFilesDiv.textContent = "No files saved";
      openFilesDiv.style.textAlign = "center";
    }
    for (const fileName of fileNames) {
      const fileRow = document.createElement("div");
      openFilesDiv.appendChild(fileRow);
      fileRow.style.borderTop = "2px solid black";

      const fileLabel = document.createElement("div");
      fileRow.appendChild(fileLabel);
      fileLabel.textContent = `"${fileName}"`;
      fileLabel.style.height = fileLabel.style.lineHeight = `20px`;
      fileLabel.style.textAlign = "left";
      fileLabel.style.textOverflow = "ellipsis";
      fileLabel.style.overflow = "hidden";
      fileLabel.style.display = "inline-block";
      fileLabel.style.cursor = "pointer";

      fileLabel.addEventListener("mouseover", () => {
        fileLabel.style.color = "blue";
      });
      fileLabel.addEventListener("mouseout", () => {
        fileLabel.style.color = "black";
      });

      fileLabel.addEventListener("click", async () => {
        this.addLoadIcon();
        await this.sendModelVersioningRequest({type: "openFile", fileName: fileName});
        this.removeLoadIcon();

        this.closeDialogFunc();
      });

      const deleteFileButton = document.createElement("button");
      fileRow.appendChild(deleteFileButton);
      deleteFileButton.style.cssFloat = "right";
      deleteFileButton.style.height = "100%";
      deleteFileButton.style.textAlign = "center";
      deleteFileButton.style.padding = "0px";
      deleteFileButton.style.display = "inline-block";
      deleteFileButton.textContent = "X";
      deleteFileButton.addEventListener("click", async () => {
        if (confirm("Delete file?")) {
          this.addLoadIcon();
          await this.sendModelVersioningRequest({type: "deleteFile", fileName: fileName});
          this.removeLoadIcon();

          // if div still containers file row - User may have clicked delete button twice
          if (openFilesDiv.contains(fileRow)) {
            openFilesDiv.removeChild(fileRow);
          }
        }
      });
    }
  }
}
