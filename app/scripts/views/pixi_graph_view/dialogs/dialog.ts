
export class Dialog {
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
    width: number,
    height: number,
  ) {
    this.root = document.createElement("div");

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
