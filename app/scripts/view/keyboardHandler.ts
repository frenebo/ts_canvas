import {
  RequestInfoFunc,
  RequestModelChangesFunc,
  RequestVersioningChangeFunc,
} from "../messenger.js";
import { DialogManager } from "./dialogs/dialogManager.js";
import { SelectionManager } from "./selectionManager.js";

interface IShortcutDescription {
  eventKeyName: string; // must be lowercase!
  ctrlMeta?: boolean;
  shift?: boolean;
}

export class KeyboardHandler {
  private static matchShortcuts<T extends string>(
    ev: KeyboardEvent,
    shortcuts: {[key in T]: IShortcutDescription[]},
  ): T[] {
    const matches: T[] = [];

    for (const shortcutKey of Object.keys(shortcuts) as T[]) {
      for (const description of shortcuts[shortcutKey]) {

        if (
          description.eventKeyName === ev.key.toLowerCase() &&
          (description.ctrlMeta === undefined || (ev.ctrlKey || ev.metaKey) === description.ctrlMeta) &&
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

  private static stringifyShortcuts(shortcuts: IShortcutDescription[]): string {
    const descriptions: string[] = [];

    for (const shortcut of shortcuts) {
      let description = "";
      if (shortcut.ctrlMeta === true) {
        description += "Ctrl-";
      }
      if (shortcut.shift === true) {
        description += "Shift-";
      }

      description += shortcut.eventKeyName[0].toUpperCase() + shortcut.eventKeyName.slice(1);
      descriptions.push(description);
    }

    return descriptions.join(" or ");
  }

  private readonly undoShortcuts: IShortcutDescription[] = [{
    ctrlMeta: true,
    eventKeyName: "z",
    shift: false,
  }];
  private readonly redoShortcuts: IShortcutDescription[] = [
    {
      ctrlMeta: true,
      eventKeyName: "z",
      shift: true,
    },
    {
      ctrlMeta: true,
      eventKeyName: "y",
    },
  ];
  private readonly selectAllShortcuts: IShortcutDescription[] = [{
    ctrlMeta: true,
    eventKeyName: "a",
  }];
  private readonly saveShortcuts: IShortcutDescription[] = [{
    ctrlMeta: true,
    eventKeyName: "s",
    shift: false,
  }];
  private readonly saveAsShortcuts: IShortcutDescription[] = [{
    ctrlMeta: true,
    eventKeyName: "s",
    shift: true,
  }];
  private readonly openShortcuts: IShortcutDescription[] = [{
    ctrlMeta: true,
    eventKeyName: "o",
  }];
  private readonly deleteSelectionShortcuts: IShortcutDescription[] = [
    {
      eventKeyName: "delete",
    },
    {
      eventKeyName: "backspace",
    },
  ];

  constructor(
    div: HTMLDivElement,
    dialogManager: DialogManager,
    selectionManager: SelectionManager,
    sendModelChangeRequests: RequestModelChangesFunc,
    sendModelInfoRequests: RequestInfoFunc,
    sendModelVersioningRequest: RequestVersioningChangeFunc,
  ) {
    let divSelected = false;
    document.addEventListener("click", (ev) => {
      if (ev.target instanceof HTMLElement) {
        divSelected = div.contains(ev.target);
      }
    });

    document.addEventListener("keydown", async (ev) => {
      if (!divSelected) {
        return;
      }
      if (dialogManager.isADialogOpen()) {
        return;
      }

      const shortcutMatches = KeyboardHandler.matchShortcuts(ev, {
        delete: this.deleteSelectionShortcuts,
        escape: [{ eventKeyName: "escape" }],
        open: this.openShortcuts,
        redo: this.redoShortcuts,
        save: this.saveShortcuts,
        saveAs: this.saveAsShortcuts,
        selectAll: this.selectAllShortcuts,
        undo: this.undoShortcuts,
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
          sendModelVersioningRequest({type: "undo"}).catch((reason) => {
            throw new Error(`Failed to undo: ${reason}`);
          });
        } else if (match === "redo") {
          sendModelVersioningRequest({type: "redo"}).catch((reason) => {
            throw new Error(`Failed to redo: ${reason}`);
          });
        } else if (match === "selectAll") {
          selectionManager.selectAll();
        } else if (match === "save") {
          const openFileData = await sendModelInfoRequests<"fileIsOpen">({type: "fileIsOpen"});
          if (openFileData.fileIsOpen) {
            sendModelVersioningRequest({ type: "saveFile", fileName: openFileData.fileName }).catch((reason) => {
              throw new Error(`Failed to save file: ${reason}`);
            });
          } else {
            dialogManager.saveAsDialog();
          }
        } else if (match === "open") {
          dialogManager.openDialog();
        } else if (match === "saveAs") {
          dialogManager.saveAsDialog();
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

  public saveAsShortcutString(): string {
    return KeyboardHandler.stringifyShortcuts(this.saveAsShortcuts);
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
