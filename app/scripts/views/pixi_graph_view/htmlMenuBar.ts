import {
  ModelChangeRequest, ModelInfoRequestType, ModelInfoRequestMap, ModelVersioningRequest, ModelInfoResponseMap,
} from "../../interfaces.js";
import { KeyboardHandler } from "./keyboardHandler.js";
import { SelectionManager } from "./selectionManager.js";
import { Dialogs } from "./dialogs.js";

export class HtmlMenuBar {
  private static readonly barBackground = "#44596e";
  private static readonly menuItemDefaultBackground = "#34495e";
  private static readonly menuItemMouseoverBackground = "#999999";
  private static readonly itemHeight = 40;
  private static readonly itemMinWidth = 70;

  private readonly lists: HTMLUListElement[] = [];
  private readonly fileUpToDateLabel: HTMLDivElement;

  constructor(
    private readonly div: HTMLDivElement,
    width: number,
    private readonly height: number,
    fileMenu: Dialogs,
    keyboardHandler: KeyboardHandler,
    selectionManager: SelectionManager,
    sendModelChangeRequest: (req: ModelChangeRequest) => void,
    sendModelInfoRequest: <T extends ModelInfoRequestType>(req: ModelInfoRequestMap[T]) => ModelInfoResponseMap[T],
    sendModelVersioningRequest: (req: ModelVersioningRequest) => void,
  ) {
    div.style.width = `${width}px`;
    div.style.backgroundColor = HtmlMenuBar.barBackground;
    div.style.overflow = "visible";
    div.style.height = `${this.height}px`;
    div.style.fontFamily = "Helvetica Neue,Helvetica,Arial";
    div.style.zIndex = "10";
    const that = this;

    document.addEventListener("mousedown", (ev) => {
      let listToLeaveOpen: HTMLUListElement | undefined;
      if (ev.target instanceof Element) {
        for (const list of that.lists) {
          if (list.contains(ev.target)) listToLeaveOpen = list;
        }
      }
      that.collapseMenus(listToLeaveOpen);
    });

    document.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape") {
        that.collapseMenus();
      }
    });

    this.addMenuList("File", [
      {
        text: "Save",
        tooltip: keyboardHandler.saveShortcutString(),
        onclick: () => {
          const openFileData = sendModelInfoRequest<"fileIsOpen">({type: "fileIsOpen"});
          if (openFileData.fileIsOpen) {
            sendModelVersioningRequest({ type: "saveFile", fileName: openFileData.fileName });
          } else {
            fileMenu.saveAsDialog();
          }
        },
      },
      {
        text: "Save As",
        tooltip: keyboardHandler.saveAsShortcutString(),
        onclick: () => {
          fileMenu.saveAsDialog();
        },
      },
      {
        text: "Open",
        tooltip: keyboardHandler.openShortcutString(),
        onclick: () => {
          fileMenu.openDialog();
        },
      },
    ]);
    this.addMenuList("Edit", [
      {
        text: "Undo",
        tooltip: keyboardHandler.undoShortcutString(),
        onclick: () => {
          sendModelVersioningRequest({type: "undo"});
        },
      },
      {
        text: "Redo",
        tooltip: keyboardHandler.redoShortcutString(),
        onclick: () => {
          sendModelVersioningRequest({type: "redo"});
        },
      },
      {
        text: "Select All",
        tooltip: keyboardHandler.selectAllShortcutString(),
        onclick: () => {
          selectionManager.selectAll();
        },
      },
      {
        text: "Delete Selection",
        tooltip: keyboardHandler.deleteSelectionShortcutString(),
        onclick: () => {
          selectionManager.deleteSelection();
        },
      },
    ]);

    this.fileUpToDateLabel = document.createElement("div");
    this.div.appendChild(this.fileUpToDateLabel);
    this.fileUpToDateLabel.style.display = "inline-block";
    this.fileUpToDateLabel.style.height = `${height}px`;
    this.fileUpToDateLabel.style.lineHeight = `${height}px`;
    this.fileUpToDateLabel.style.paddingLeft = "20px";
    this.fileUpToDateLabel.style.color = "white";
    this.fileUpToDateLabel.style.fontWeight = "bold";
    // make text non-selectable
    this.fileUpToDateLabel.style.userSelect = "none";
    this.fileUpToDateLabel.style.webkitUserSelect = "none";

    this.setUnsavedChanges(false);
    this.collapseMenus();
  }

  public setUnsavedChanges(unsavedChanges: boolean): void {
    this.fileUpToDateLabel.textContent = unsavedChanges ? "Unsaved changes" : "";
  }

  private collapseMenus(listToLeaveOpen?: HTMLUListElement): void {
    for (const list of this.lists) {
      if (list !== listToLeaveOpen) {
        list.style.overflow = "hidden";
      }
    }
  }

  private addMenuList(
    title: string,
    subItems: Array<{
      text: string;
      tooltip?: string;
      onclick(): void;
    }>,
  ): void {
    const list = document.createElement("ul");
    this.lists.push(list);
    list.style.padding = "0";
    list.style.marginLeft = "6px";
    list.style.marginBottom = "0px";
    list.style.marginTop = "5px";
    list.style.marginRight = "0px";
    list.style.listStyle = "none";
    list.style.display = "inline-block";
    list.style.verticalAlign = "top";
    list.style.overflow = "hidden";
    list.style.height = `${HtmlMenuBar.itemHeight}px`;
    list.style.width = `${HtmlMenuBar.itemMinWidth}px`;
    this.div.appendChild(list);

    const titleItem = document.createElement("button");
    list.appendChild(titleItem);
    this.menuItemSetup(titleItem, title, "center");

    const subButtons: HTMLButtonElement[] = [];
    for (const {text, tooltip, onclick} of subItems) {
      const subItem = document.createElement("button");
      list.appendChild(subItem);
      subButtons.push(subItem);
      this.menuItemSetup(subItem, text, "left", tooltip, true);
      subItem.addEventListener("click", (ev) => {
        onclick();
      });
    }

    const maxSubItemWidth = Math.max(...subButtons.map((button) => button.clientWidth));
    for (const subItem of subButtons) {
      subItem.style.minWidth = `${maxSubItemWidth}px`;
    }

    titleItem.addEventListener("mousedown", (ev) => {
      if (list.style.overflow !== "hidden") {
        list.style.overflow = "hidden";
      } else {
        list.style.overflow = null;
      }
    });
    const that = this;
    titleItem.addEventListener("mouseover", () => {
      let aListIsOpen = false;

      for (const otherList of that.lists.filter((l) => l !== list)) {
        if (otherList.style.overflow !== "hidden") aListIsOpen = true;
      }

      if (aListIsOpen) {
        that.collapseMenus(); // close other litss
        list.style.overflow = null; // open this list
      }
    });
  }

  private menuItemSetup(
    el: HTMLElement,
    text: string,
    align: "left" | "center",
    tooltip?: string,
    extraPadding = false,
  ): void {
    const bottomBorderHeight = 5;
    if (typeof tooltip === "string") el.title = tooltip;
    // el.style.verticalAlign = "top";
    el.style.border = "none";
    el.style.borderBottom = `${bottomBorderHeight}px solid #2c3e50`;
    el.style.height = `${HtmlMenuBar.itemHeight}px`;
    el.style.lineHeight = `${HtmlMenuBar.itemHeight - bottomBorderHeight}px`;
    el.style.minWidth = `${HtmlMenuBar.itemMinWidth}px`;

    el.style.paddingLeft = extraPadding ? "20px" : "0px";
    el.style.paddingRight = extraPadding ? "20px" : "0px";

    el.style.display = "block";
    el.style.textAlign = align;
    el.style.textDecoration = "none";
    el.style.whiteSpace = "nowrap";
    el.style.cursor = "pointer";

    el.textContent = text;
    el.style.fontSize = "20px";

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
