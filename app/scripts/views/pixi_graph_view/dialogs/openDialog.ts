import { Dialog } from "./dialogs.js";

export class OpenDialog extends Dialog {
  constructor(
    closeDialogFunc: () => void,
    div: HTMLDivElement,
    width: number,
    height: number,
    fileNames: string[],
    openFunc: (fileName: string) => void,
    deleteFunc: (fileName: string) => void,
  ) {
    super(closeDialogFunc, div, width, height);

    const saveAsTitle = Dialog.createTitle("Open");
    this.root.appendChild(saveAsTitle);

    const openFilesDiv = document.createElement("div");
    this.root.appendChild(openFilesDiv);
    openFilesDiv.style.overflowY = "scroll";
    openFilesDiv.style.height = "80%";
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

      fileLabel.addEventListener("click", () => {
        openFunc(fileName);
        closeDialogFunc();
      });

      const deleteFileButton = document.createElement("button");
      fileRow.appendChild(deleteFileButton);
      deleteFileButton.style.cssFloat = "right";
      deleteFileButton.style.height = "100%";
      deleteFileButton.style.textAlign = "center";
      deleteFileButton.style.padding = "0px";
      deleteFileButton.style.display = "inline-block";
      deleteFileButton.textContent = "X";
      deleteFileButton.addEventListener("click", () => {
        if (confirm("Delete file?")) {
          deleteFunc(fileName);
          openFilesDiv.removeChild(fileRow);
        }
      });
    }
  }
}
