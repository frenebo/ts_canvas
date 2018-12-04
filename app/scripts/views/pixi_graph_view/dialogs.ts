import {
  ModelInfoRequestType, ModelVersioningRequest, ModelInfoRequestMap, ModelInfoResponseMap,
} from "../../interfaces";

class Dialog {
  protected static createTitle(titleText: string) {
    const titleDiv = document.createElement("div");
    titleDiv.textContent = titleText;
    titleDiv.style.fontSize = "30px";
    titleDiv.style.fontWeight = "bold";
    titleDiv.style.textAlign = "center";
    titleDiv.style.marginTop = "15px";

    return titleDiv;
  }

  public readonly root: HTMLDivElement;

  constructor(
    closeDialogFunc: () => void,
    div: HTMLDivElement,
    width: number,
    height: number,
  ) {
    this.root = document.createElement("div");
    div.appendChild(this.root);

    this.root.style.width = `${width}px`;
    this.root.style.height = `${height}px`;
    this.root.style.marginLeft = `${width/2}px`;
    this.root.style.marginTop = `${height/2}px`;
    this.root.style.backgroundColor = "#DDDDDD";
    this.root.style.position = "relative";
    this.root.style.borderRadius = "7px";
    this.root.style.borderWidth = "3px";
    this.root.style.borderColor = "#444444";
    this.root.style.borderStyle = "solid";
    this.root.style.fontFamily = "Helvetica Neue,Helvetica,Arial";
    this.root.style.zIndex = "11";

    const closeButton = document.createElement("button");
    this.root.appendChild(closeButton);
    closeButton.style.cssFloat = "right";
    closeButton.style.lineHeight = closeButton.style.height = closeButton.style.width = "20px";
    closeButton.style.textAlign = "center";
    closeButton.style.padding = "0px";
    closeButton.style.marginTop = "5px";
    closeButton.style.marginRight = "5px";
    closeButton.textContent = "X";
    closeButton.addEventListener("mousedown", () => {
      closeDialogFunc();
    });
  }
}

class OpenDialog extends Dialog {
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

class SaveAsDialog extends Dialog {
  constructor(
    closeDialogFunc: () => void,
    div: HTMLDivElement,
    width: number,
    height: number,
    saveFunc: (fileName: string) => void,
  ) {
    super(closeDialogFunc, div, width, height);

    const saveAsTitle = Dialog.createTitle("Save As");
    this.root.appendChild(saveAsTitle);

    const inputDiv = document.createElement("div");
    this.root.appendChild(inputDiv);

    inputDiv.style.width = "80%";
    inputDiv.style.margin = "auto";

    const textInput = document.createElement("input");
    inputDiv.appendChild(textInput);
    textInput.placeholder = "Enter File name";
    textInput.style.width = "80%";
    textInput.style.display = "inline-block";
    textInput.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") {
        if (textInput.value.trim() !== "") {
          saveFunc(textInput.value);
          closeDialogFunc();
        }
      }
    });
    textInput.focus();

    const saveButton = document.createElement("button");
    inputDiv.appendChild(saveButton);
    saveButton.style.display = "inline-block";
    saveButton.style.height = "100%";
    saveButton.textContent = "Save";
    saveButton.addEventListener("click", () => {
      if (textInput.value.trim() !== "") {
        saveFunc(textInput.value);
        closeDialogFunc();
      }
    });
  }
}

class EditLayerDialog extends Dialog {
  constructor(
    closeDialogFunc: () => void,
    div: HTMLDivElement,
    width: number,
    height: number
  ) {
    super(closeDialogFunc, div, width, height);
    const editLayerTitle = Dialog.createTitle("Edit Layer");
    this.root.appendChild(editLayerTitle);
  }
}

export class Dialogs {
  private currentDialog: null | Dialog = null;

  constructor(
    private readonly div: HTMLDivElement,
    private readonly sendModelInfoRequest:
      <T extends ModelInfoRequestType>(req: ModelInfoRequestMap[T]) => ModelInfoResponseMap[T],
    private readonly sendModelVersioningRequest: (req: ModelVersioningRequest) => void,
  ) {
    const that = this;
    document.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape") {
        that.closeDialog();
      }
    });
  }

  private closeDialog(): void {
    if (this.currentDialog === null) return;

    this.div.removeChild(this.currentDialog.root);
    this.currentDialog = null;
  }

  public saveAsDialog(): void {
    if (this.currentDialog !== null) this.closeDialog();

    const dialog = new SaveAsDialog(
      () => { this.closeDialog(); },
      this.div,
      this.div.clientWidth/2,
      this.div.clientHeight/2,
      (fileName: string) => {
        this.sendModelVersioningRequest({ type: "saveFile", fileName: fileName });
      },
    );

    this.currentDialog = dialog;
  }

  public openDialog(): void {
    if (this.currentDialog !== null) this.closeDialog();

    const dialog = new OpenDialog(
      () => { this.closeDialog(); },
      this.div,
      this.div.clientWidth/2,
      this.div.clientHeight/2,
      this.sendModelInfoRequest<"savedFileNames">({type: "savedFileNames"}).fileNames,
      (fileName: string) => { this.sendModelVersioningRequest({ type: "openFile", fileName: fileName }); },
      (fileName: string) => { this.sendModelVersioningRequest({ type: "deleteFile", fileName: fileName}); },
    );

    this.currentDialog = dialog;
  }

  public editLayerDialog(vertexId: string): void {
    if (this.currentDialog !== null) this.closeDialog();

    const dialog = new EditLayerDialog(
      () => { this.closeDialog(); },
      this.div,
      this.div.clientWidth/2,
      this.div.clientHeight/2,
    );

    this.currentDialog = dialog;
  }
}
