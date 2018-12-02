import { SelectionManager } from "./selectionManager";
import { ModelChangeRequest, ModelVersioningRequest } from "../../interfaces";
import { FileMenu } from "./fileMenu";

interface ShortcutDescription {
  eventKeyName: string, // must be lowercase!
  ctrl?: boolean,
  shift?: boolean
}

export class KeyboardHandler {
  private static matchShortcuts<T extends string>(ev: KeyboardEvent, shortcuts: {[key in T]: ShortcutDescription[]}): T[] {
    const matches: T[] = [];

    for (const shortcutKey in shortcuts) {
      for (const description of shortcuts[shortcutKey]) {

        if (
          description.eventKeyName === ev.key.toLowerCase() &&
          (description.ctrl === undefined || ev.ctrlKey === description.ctrl) &&
          (description.shift === undefined || ev.shiftKey === description.shift)
        ) {
          if (matches.indexOf(shortcutKey) === -1) {
            matches.push(shortcutKey);
          }
        }
      }
    }

    return matches;
  }

  private static stringifyShortcuts(shortcuts: ShortcutDescription[]): string {
    const descriptions: string[] = [];

    for (const shortcut of shortcuts) {
      let description = "";
      if (shortcut.ctrl) description += "Ctrl-";
      if (shortcut.shift) {
        description += "Shift-";
      }

      description += shortcut.eventKeyName[0].toUpperCase() + shortcut.eventKeyName.slice(1);
      descriptions.push(description);
    }

    return descriptions.join(" or ");
  }

  private undoShortcuts: ShortcutDescription[] = [{
    eventKeyName: "z",
    ctrl: true,
    shift: false,
  }];
  private redoShortcuts: ShortcutDescription[] = [
    {
      eventKeyName: "z",
      ctrl: true,
      shift: true,
    },
    {
      eventKeyName: "y",
      ctrl: true,
    }
  ];
  private selectAllShortcuts: ShortcutDescription[] = [{
    eventKeyName: "a",
    ctrl: true,
  }];
  private saveShortcuts: ShortcutDescription[] = [{
    eventKeyName: "s",
    ctrl: true,
  }];
  private openShortcuts: ShortcutDescription[] = [{
    eventKeyName: "o",
    ctrl: true,
  }];
  private deleteSelectionShortcuts: ShortcutDescription[] = [{ eventKeyName: "delete" }];

  constructor(
    div: HTMLDivElement,
    fileMenu: FileMenu,
    selectionManager: SelectionManager,
    sendModelChangeRequests: (...reqs: ModelChangeRequest[]) => void,
    sendModelVersioningRequest: (req: ModelVersioningRequest) => void,
  ) {
    let divSelected = false;
    document.addEventListener("click", (ev) => {
      if (ev.target instanceof HTMLElement) {
        divSelected = div.contains(ev.target);
      }
    });

    document.addEventListener("keydown", (ev) => {
      if (!divSelected) return;

      const shortcutMatches = KeyboardHandler.matchShortcuts(ev, {
        undo: this.undoShortcuts,
        redo: this.redoShortcuts,
        delete: this.deleteSelectionShortcuts,
        escape: [{ eventKeyName: "escape" }],
        selectAll: this.selectAllShortcuts,
        save: this.saveShortcuts,
        open: this.openShortcuts,
      });

      if (shortcutMatches.length !== 0) {
        ev.preventDefault();
      }

      for (const match of shortcutMatches) {
        if (match === "delete") {
          selectionManager.deleteSelection();
        } else if (match === "escape") {
          selectionManager.clearSelection();
        } else if (match === "undo") {
          sendModelVersioningRequest({type: "undo"});
        } else if (match === "redo") {
          sendModelVersioningRequest({type: "redo"});
        } else if (match === "selectAll") {
          selectionManager.selectAll();
        } else if (match === "save") {
          fileMenu.saveDialog();
        } else if (match === "open") {
          fileMenu.openDialog();
        }
      }
    });
  }

  public selectAllShortcutString(): string {
    return KeyboardHandler.stringifyShortcuts(this.selectAllShortcuts);
  }

  public deleteSelectionShortcutString(): string {
    return KeyboardHandler.stringifyShortcuts(this.deleteSelectionShortcuts);
  }

  public saveShortcutString(): string {
    return KeyboardHandler.stringifyShortcuts(this.saveShortcuts);
  }

  public openShortcutString(): string {
    return KeyboardHandler.stringifyShortcuts(this.openShortcuts);
  }

  public undoShortcutString(): string {
    return KeyboardHandler.stringifyShortcuts(this.undoShortcuts);
  }

  public redoShortcutString(): string {
    return KeyboardHandler.stringifyShortcuts(this.redoShortcuts);
  }
}
