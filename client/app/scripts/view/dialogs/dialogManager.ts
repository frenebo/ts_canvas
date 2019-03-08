import {
  RequestInfoFunc,
  RequestModelChangesFunc,
  RequestVersioningChangeFunc,
} from "../../messenger.js";
import { AddLayerDialog } from "./addLayerDialog.js";
import { Dialog } from "./dialog.js";
import { EditLayerDialog } from "./editLayerDialog.js";
import { OpenDialog } from "./openDialog.js";
import { SaveAsDialog } from "./saveAsDialog.js";

/** A class that manages, creates, and closes dialogs */
export class DialogManager {
  private static readonly dialogWidth = 700;
  private static readonly dialogHeight = 500;

  private currentDialog: null | Dialog = null;

  /**
   * Constructs a DialogManager.
   * @param div - The div the dialog manager puts dialogs in
   * @param sendModelChangeRequests - An asynchronous function to request changes to the model
   * @param sendModelInfoRequests - An asynchronous function to request info from the model
   * @param sendModelVersioningRequest - An asynchronous function to request versioning changes to the model
   */
  constructor(
    private readonly div: HTMLDivElement,
    private readonly sendModelChangeRequests: RequestModelChangesFunc,
    private readonly sendModelInfoRequests: RequestInfoFunc,
    private readonly sendModelVersioningRequest: RequestVersioningChangeFunc,
  ) {
    const that = this;
    document.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape") {
        that.closeDialog();
      }
    });
  }

  /**
   * Gives whether a dialog is currently open.
   * @returns Whether or not a dialog is currently open
   */
  public isADialogOpen(): boolean {
    return this.currentDialog !== null;
  }

  /**
   * Opens an "add layer" dialog and closes any dialog already open.
   */
  public addLayerDialog(): void {
    if (this.currentDialog !== null) {
      this.closeDialog();
    }

    const dialog = new AddLayerDialog(
      () => { this.closeDialog(); },
      DialogManager.dialogWidth,
      DialogManager.dialogHeight,
      this.sendModelInfoRequests,
    );
    this.div.appendChild(dialog.root);
    this.currentDialog = dialog;
  }

  /**
   * Opens a "save as" dialog and closes any dialog already open.
   */
  public saveAsDialog(): void {
    if (this.currentDialog !== null) {
      this.closeDialog();
    }
    const dialog = new SaveAsDialog(
      () => { this.closeDialog(); },
      DialogManager.dialogWidth,
      DialogManager.dialogHeight,
      this.sendModelVersioningRequest,
    );
    this.div.appendChild(dialog.root);

    this.currentDialog = dialog;
  }

  /**
   * Opens an "open" dialog and closes any dialog already open.
   */
  public openDialog(): void {
    if (this.currentDialog !== null) {
      this.closeDialog();
    }

    const dialog = new OpenDialog(
      () => { this.closeDialog(); },
      DialogManager.dialogWidth,
      DialogManager.dialogHeight,
      this.sendModelInfoRequests,
      this.sendModelVersioningRequest,
    );
    this.div.appendChild(dialog.root);

    this.currentDialog = dialog;
  }

  /**
   * Opens an "edit layer" dialog for the layer with the given id, and closes any dialog already open.
   * @param layerId - The id of the layer to open the dialog for
   */
  public editLayerDialog(layerId: string): void {
    if (this.currentDialog !== null) {
      this.closeDialog();
    }

    const dialog = new EditLayerDialog(
      () => { this.closeDialog(); },
      DialogManager.dialogWidth,
      DialogManager.dialogHeight,
      this.sendModelChangeRequests,
      this.sendModelInfoRequests,
      layerId,
    );
    this.div.appendChild(dialog.root);

    this.currentDialog = dialog;
  }

  /**
   * Closes a dialog if one is open.
   */
  private closeDialog(): void {
    if (this.currentDialog === null) {
      return;
    }

    this.div.removeChild(this.currentDialog.root);
    this.currentDialog = null;
  }
}
