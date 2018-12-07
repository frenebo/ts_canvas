import { SelectionManager } from "./selectionManager.js";
import { DialogManager } from "./dialogs/dialogManager.js";
import { RequestModelChangesFunc, RequestInfoFunc, RequestVersioningChangeFunc } from "../../messenger.js";

interface ShortcutDescription {
  eventKeyName: string; // must be lowercase!
  ctrlMeta?: boolean;
  shift?: boolean;
}

export class KeyboardHandler {
  private static matchShortcuts<T extends string>(
    ev: KeyboardEvent,
    shortcuts: {[key in T]: ShortcutDescription[]},
  ): T[] {
    const matches: T[] = [];

    for (const shortcutKey in shortcuts) {
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

  private static stringifyShortcuts(shortcuts: ShortcutDescription[]): string {
    const descriptions: string[] = [];

    for (const shortcut of shortcuts) {
      let description = "";
      if (shortcut.ctrlMeta === true) description += "Ctrl-";
      if (shortcut.shift === true) {
        description += "Shift-";
      }

      description += shortcut.eventKeyName[0].toUpperCase() + shortcut.eventKeyName.slice(1);
      descriptions.push(description);
    }

    return descriptions.join(" or ");
  }

  private readonly undoShortcuts: ShortcutDescription[] = [{
    eventKeyName: "z",
    ctrlMeta: true,
    shift: false,
  }];
  private readonly redoShortcuts: ShortcutDescription[] = [
    {
      eventKeyName: "z",
      ctrlMeta: true,
      shift: true,
    },
    {
      eventKeyName: "y",
      ctrlMeta: true,
    },
  ];
  private readonly selectAllShortcuts: ShortcutDescription[] = [{
    eventKeyName: "a",
    ctrlMeta: true,
  }];
  private readonly saveShortcuts: ShortcutDescription[] = [{
    eventKeyName: "s",
    ctrlMeta: true,
    shift: false,
  }];
  private readonly saveAsShortcuts: ShortcutDescription[] = [{
    eventKeyName: "s",
    ctrlMeta: true,
    shift: true,
  }];
  private readonly openShortcuts: ShortcutDescription[] = [{
    eventKeyName: "o",
    ctrlMeta: true,
  }];
  private readonly deleteSelectionShortcuts: ShortcutDescription[] = [{
    eventKeyName: "delete",
  }];

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
      if (!divSelected) return;
      if (dialogManager.isADialogOpen()) return;

      const shortcutMatches = KeyboardHandler.matchShortcuts(ev, {
        undo: this.undoShortcuts,
        redo: this.redoShortcuts,
        delete: this.deleteSelectionShortcuts,
        escape: [{ eventKeyName: "escape" }],
        selectAll: this.selectAllShortcuts,
        save: this.saveShortcuts,
        saveAs: this.saveAsShortcuts,
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
          const openFileData = await sendModelInfoRequests<"fileIsOpen">({type: "fileIsOpen"});
          if (openFileData.fileIsOpen) {
            sendModelVersioningRequest({ type: "saveFile", fileName: openFileData.fileName });
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
