
/** Class that contains an HTML dialog that the user interacts with  */
export class Dialog {
  /**
   * Creates a small load icon HTMLDivElement
   * @returns The small load icon HTMLDivElement
   */
  public static createSmallLoadIcon(): HTMLDivElement {
    const div = document.createElement("div");
    div.style.height = "0";
    div.style.overflow = "visible";
    const loadIcon = document.createElement("div");
    div.appendChild(loadIcon);
    loadIcon.style.width = `10px`;
    loadIcon.style.height = `10px`;
    loadIcon.style.margin = "0 auto";
    loadIcon.style.border = "3px solid #f3f3f3"; /* Light grey */
    loadIcon.style.borderTop = "3px solid #3498db"; /* Blue */
    loadIcon.style.borderRadius = "50%";
    loadIcon.style.animation = "spin 2s linear infinite"; // spin is from css file
    // loadIcon.style.marginTop = "0px";
    // loadIcon.style.marginBottom = "0px";
    return div;
  }

  /**
   * Creates a title HTMLDivElement with the given text
   * @param titleText - The text of the title element
   * @returns The created title HTMLDivElement
   */
  protected static createTitle(titleText: string): HTMLDivElement {
    const titleDiv = document.createElement("div");
    titleDiv.textContent = titleText;
    titleDiv.style.fontSize = "30px";
    titleDiv.style.fontWeight = "bold";
    titleDiv.style.textAlign = "center";
    titleDiv.style.marginTop = "15px";

    return titleDiv;
  }

  /**
   * Creates a normal-sized HTMLDivElement load icon
   * @returns The HTMLDivElement load icon
   */
  private static createLoadIcon(): HTMLDivElement {
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

  /**
   * Constructs a Dialog
   * @param closeDialogFunc - The function the dialog can call to get itself closed
   * @param width - The width of the dialog
   * @param height - The height of the dialog
   */
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

  /**
   * Adds a normal-sized load icon to the end of the dialog's root element, unless a load icon is already there
   */
  protected addLoadIcon() {
    if (this.loadIcon === null) {
      this.loadIcon = Dialog.createLoadIcon();
      this.root.appendChild(this.loadIcon);
    }
  }

  /**
   * Removes the load icon if the load icon is present in the dialog's root element
   */
  protected removeLoadIcon() {
    if (this.loadIcon !== null) {
      this.root.removeChild(this.loadIcon);
      this.loadIcon = null;
    }
  }
}
