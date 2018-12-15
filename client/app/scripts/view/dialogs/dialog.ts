
export class Dialog {

  public static createSmallLoadIcon() {
    const div = document.createElement("div");
    const loadIcon = document.createElement("div");
    div.appendChild(loadIcon);
    // loadIcon.classList.add("loader");
    loadIcon.style.width = `10px`;
    loadIcon.style.height = `10px`;
    loadIcon.style.margin = "0 auto";
    loadIcon.style.border = "3px solid #f3f3f3"; /* Light grey */
    loadIcon.style.borderTop = "3px solid #3498db"; /* Blue */
    loadIcon.style.borderRadius = "50%";
    loadIcon.style.animation = "spin 2s linear infinite"; // spin is from css file
    loadIcon.style.marginTop = "0px";
    loadIcon.style.marginBottom = "0px";
    return div;
  }

  protected static createTitle(titleText: string) {
    const titleDiv = document.createElement("div");
    titleDiv.textContent = titleText;
    titleDiv.style.fontSize = "30px";
    titleDiv.style.fontWeight = "bold";
    titleDiv.style.textAlign = "center";
    titleDiv.style.marginTop = "15px";

    return titleDiv;
  }

  private static createLoadIcon() {
    const div = document.createElement("div");
    div.style.marginTop = "10px";
    div.style.marginBottom = "10px";

    const loadIcon = document.createElement("div");
    div.appendChild(loadIcon);
    // loadIcon.classList.add("loader");
    loadIcon.style.width = `40px`;
    loadIcon.style.height = `40px`;
    loadIcon.style.margin = "0 auto";
    loadIcon.style.border = "6px solid #f3f3f3"; /* Light grey */
    loadIcon.style.borderTop = "6px solid #3498db"; /* Blue */
    loadIcon.style.borderRadius = "50%";
    loadIcon.style.animation = "spin 2s linear infinite"; // spin is from css file
    return div;
  }

  public readonly root: HTMLDivElement;
  private loadIcon: HTMLDivElement | null = null;

  constructor(
    closeDialogFunc: () => void,
    width: number,
    height: number,
  ) {
    this.root = document.createElement("div");

    this.root.style.width = `${width}px`;
    this.root.style.height = `${height}px`;
    this.root.style.margin = "0 auto";
    // this.root.style.marginLeft = `${width/2}px`;
    this.root.style.marginTop = "100px";
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

  protected addLoadIcon() {
    if (this.loadIcon === null) {
      this.loadIcon = Dialog.createLoadIcon();
      this.root.appendChild(this.loadIcon);
    }
  }

  protected removeLoadIcon() {
    if (this.loadIcon !== null) {
      this.root.removeChild(this.loadIcon);
      this.loadIcon = null;
    }
  }
}
