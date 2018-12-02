import { ModelInfoRequestType, ModelVersioningRequest, ModelInfoRequestMap, ModelInfoResponseMap } from "../../interfaces";

export class FileMenu {
  private dialogOpen = false;
  constructor(
    private readonly div: HTMLDivElement,
    private readonly sendModelInfoRequest: <T extends ModelInfoRequestType>(req: ModelInfoRequestMap[T]) => ModelInfoResponseMap[T],
    private readonly sendModelVersioningRequest: (req: ModelVersioningRequest) => void,
  ) {

  }

  public saveDialog(): void {
    if (this.dialogOpen) return;

    const fileIsOpenResponse = this.sendModelInfoRequest<"fileIsOpen">({type: "fileIsOpen"});
    if (fileIsOpenResponse.fileIsOpen) {
      this.sendModelVersioningRequest({type: "saveFile", fileName: fileIsOpenResponse.fileName});
    } else {
      this.saveAsDialog();
    }
  }

  public saveAsDialog(): void {
    if (this.dialogOpen) return;

    const dialog = this.emptyDialog();
    this.div.appendChild(dialog);

    const saveAsTitle = this.createTitle("Save As");
    dialog.appendChild(saveAsTitle);

    this.dialogOpen = true;
  }

  private createTitle(titleText: string) {
    const titleDiv = document.createElement("div");
    titleDiv.textContent = titleText;
    titleDiv.style.fontSize = "20";
    titleDiv.style.fontWeight = "bold";
    titleDiv.style.textAlign = "center";
    titleDiv.style.marginTop = "15px";

    return titleDiv;
  }

  private emptyDialog() {
    const dialog = document.createElement("div");

    dialog.style.width = `${this.div.clientWidth/2}px`;
    dialog.style.height = `${this.div.clientHeight/2}px`;
    dialog.style.marginLeft = `${this.div.clientWidth/4}px`;
    dialog.style.marginTop = `${this.div.clientHeight/4}px`;
    dialog.style.backgroundColor = "#DDDDDD";
    dialog.style.position = "relative";
    dialog.style.borderRadius = "7px";
    dialog.style.borderWidth = "3px";
    dialog.style.borderColor = "#444444";
    dialog.style.borderStyle = "solid";
    dialog.style.fontFamily = "Arial";
    dialog.style.zIndex = "11";

    return dialog;
  }

  public openDialog(): void {
    if (this.dialogOpen) return;

    const dialog = this.emptyDialog();
    this.div.appendChild(dialog);

    const saveAsTitle = this.createTitle("Open");
    dialog.appendChild(saveAsTitle);

    const openFilesDiv = document.createElement("div");
    dialog.appendChild(openFilesDiv);
    openFilesDiv.style.overflowY = "scroll";
    openFilesDiv.style.height = "80%";

    const getFileNames = this.sendModelInfoRequest<"savedFileNames">({type: "savedFileNames"});
    for (const fileName of getFileNames.fileNames) {
      const fileEntry = document.createElement("div");
      openFilesDiv.appendChild(fileEntry);
      fileEntry.textContent = `"${fileName}"`;
      fileEntry.style.marginLeft = "10px";
    }

    this.dialogOpen = true;
  }
}
