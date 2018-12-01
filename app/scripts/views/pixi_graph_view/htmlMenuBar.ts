import { ModelChangeRequest, ModelInfoRequestType, ModelInfoRequestMap, ModelVersioningRequest, ModelInfoResponseMap } from "../../interfaces";

export class HtmlMenuBar {
  private static barBackground = "#44596e";
  private static menuItemDefaultBackground = "#34495e";
  private static menuItemMouseoverBackground = "#999999";
  constructor(
    private readonly div: HTMLDivElement,
    width: number,
    private readonly height: number,
    private readonly sendModelChangeRequest: (req: ModelChangeRequest) => void,
    private readonly sendModelInfoRequest: <T extends ModelInfoRequestType>(req: ModelInfoRequestMap[T]) => ModelInfoResponseMap[T],
    private readonly sendModelVersioningRequest: (req: ModelVersioningRequest) => void,
  ) {
    div.style.width = `${width}px`;
    div.style.backgroundColor = HtmlMenuBar.barBackground;
    div.style.overflow = "visible";
    div.style.height = `${this.height}px`;
    div.style.zIndex = "10";
    this.addMenuItem("File", ["Save", "Open"]);
    this.addMenuItem("Edit", ["Redo", "Undo"]);
  }

  private addMenuItem(title: string, subItemTexts: string[]): void {
    const list = document.createElement("ul");
    list.style.padding = "0";
    // list.style.margin = "0"
    list.style.marginLeft = "4px";
    list.style.marginBottom = "2px";
    list.style.marginTop = "2px";
    list.style.marginRight = "0px";
    list.style.listStyle = "none";
    list.style.display = "inline-block";
    list.style.overflow = "hidden";
    this.div.appendChild(list);

    const titleItem = document.createElement("button");
    list.appendChild(titleItem);
    this.menuItemSetup(titleItem, title);

    const childItems: HTMLButtonElement[] = [];
    for (const subItemText of subItemTexts) {
      const subItem = document.createElement("button");
      list.appendChild(subItem);
      this.menuItemSetup(subItem, subItemText);
    }

    titleItem.addEventListener("mouseover", () => {
      titleItem.style.backgroundColor = HtmlMenuBar.menuItemMouseoverBackground;
    });
    titleItem.addEventListener("mouseout", () => {
      titleItem.style.backgroundColor = HtmlMenuBar.menuItemDefaultBackground;
    });
    titleItem.addEventListener("click", (ev) => {
      console.log("click");
    });
  }

  private menuItemSetup(el: HTMLElement, text: string): void {
    // el.style.verticalAlign = "top";
    el.style.lineHeight = el.style.height = "30px";
    el.style.width = "50px";
    el.style.display = "block";
    // menuItem.style.marginRight = "2px";
    el.style.fontFamily = "Arial";
    el.style.textAlign = "center";
    el.style.textDecoration = "none";
    el.setAttribute("href", "#");
    el.style.cursor = "pointer";

    el.appendChild(document.createTextNode(text));

    el.style.color = "white";
    el.style.border = "none";
    el.style.borderBottom = "5px solid #2c3e50";
    el.style.backgroundColor = HtmlMenuBar.menuItemDefaultBackground;

    el.style.transition = "height 0.3s ease";
    el.style.webkitTransition = "height 0.3s ease";
  }
}
