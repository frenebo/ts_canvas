import { ModelChangeRequest, ModelInfoRequestType, ModelInfoRequestMap, ModelVersioningRequest, ModelInfoResponseMap } from "../../interfaces";

export class HtmlMenuBar {
  private static barBackground = "#44596e";
  private static menuItemDefaultBackground = "#34495e";
  private static menuItemMouseoverBackground = "#999999";
  private static itemHeight = 30;
  private static itemMinWidth = 50;

  private lists: HTMLUListElement[] = [];

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
    const that = this;

    document.addEventListener("mousedown", (ev) => {
      let listToLeaveOpen: HTMLUListElement | undefined;
      if (ev.target instanceof Element) {
        for (const list of that.lists) {
          if (list.contains(ev.target)) listToLeaveOpen = list;
        }
      }
      that.closeMenus(listToLeaveOpen);
    });

    document.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape") {
        that.closeMenus();
      }
    });

    this.addMenuItem("File", [
      ["Save", () => {}],
      ["Open", () => {}],
    ]);
    this.addMenuItem("Edit", [
      ["Undo", () => { sendModelVersioningRequest({type: "undo"}); }],
      ["Redo", () => { sendModelVersioningRequest({type: "redo"}); }],
    ]);

    this.closeMenus();
  }

  private closeMenus(listToLeaveOpen?: HTMLUListElement): void {
    for (const list of this.lists) {
      if (list !== listToLeaveOpen) {
        list.style.overflow = "hidden";
      }
    }
  }

  private addMenuItem(title: string, subItems: Array<[string, () => void]>): void {
    const list = document.createElement("ul");
    this.lists.push(list);
    list.style.padding = "0";
    list.style.marginLeft = "4px";
    list.style.marginBottom = "2px";
    list.style.marginTop = "2px";
    list.style.marginRight = "0px";
    list.style.listStyle = "none";
    list.style.display = "inline-block";
    list.style.verticalAlign = "top";
    list.style.overflow = "hidden";
    list.style.height = `${HtmlMenuBar.itemHeight}px`
    list.style.width = `${HtmlMenuBar.itemMinWidth}px`;
    this.div.appendChild(list);

    const titleItem = document.createElement("button");
    list.appendChild(titleItem);
    this.menuItemSetup(titleItem, title, "center");

    let subButtons: HTMLButtonElement[] = [];
    for (const [subItemText, onclick] of subItems) {
      const subItem = document.createElement("button");
      list.appendChild(subItem);
      subButtons.push(subItem);
      this.menuItemSetup(subItem, subItemText, "left");
      subItem.addEventListener("click", (ev) => {
        onclick();
      });
    }

    const maxSubItemWidth = Math.max(...subButtons.map((button) => button.clientWidth));
    for (const subItem of subButtons) {
      subItem.style.width = `${maxSubItemWidth}px`;
    }

    titleItem.addEventListener("mousedown", (ev) => {
      if (list.style.overflow !== "hidden") {
        list.style.overflow = "hidden";
      } else {
        list.style.overflow = null;
      }
      // if (list.style.maxHeight !== "") {
      //   list.style.maxHeight = null;
      // } else {
      //   list.style.maxHeight = `${HtmlMenuBar.itemHeight}px`;
      // }
    });
  }

  private menuItemSetup(el: HTMLElement, text: string, align: "left" | "center"): void {
    const bottomBorderHeight = 5;
    // el.style.verticalAlign = "top";
    el.style.border = "none";
    el.style.borderBottom = `${bottomBorderHeight}px solid #2c3e50`;
    el.style.height = `${HtmlMenuBar.itemHeight}px`;
    el.style.lineHeight = `${HtmlMenuBar.itemHeight - bottomBorderHeight}px`;
    el.style.minWidth = `${HtmlMenuBar.itemMinWidth}px`;
    el.style.display = "block";
    // menuItem.style.marginRight = "2px";
    el.style.fontFamily = "Arial";
    el.style.textAlign = align;
    el.style.textDecoration = "none";
    el.setAttribute("href", "#");
    el.style.cursor = "pointer";

    el.textContent = text;

    el.style.color = "white";
    el.style.backgroundColor = HtmlMenuBar.menuItemDefaultBackground;

    el.style.transition = "height 0.3s ease";
    el.style.webkitTransition = "height 0.3s ease";

    // make text non-selectable
    el.style.userSelect = "none";
    el.style.webkitUserSelect = "none";


    el.addEventListener("mouseover", () => {
      el.style.backgroundColor = HtmlMenuBar.menuItemMouseoverBackground;
    });
    el.addEventListener("mouseout", () => {
      el.style.backgroundColor = HtmlMenuBar.menuItemDefaultBackground;
    });
  }
}