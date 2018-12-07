import { Dialog } from "./dialog.js";
import { EditLayerDialog } from "./editLayerDialog.js";
import { OpenDialog } from "./openDialog.js";
import { SaveAsDialog } from "./saveAsDialog.js";
import { RequestModelChangesFunc, RequestInfoFunc } from "../../../messenger.js";

export class DialogManager {
  private static readonly dialogWidth = 700;
  private static readonly dialogHeight = 500;

  private currentDialog: null | Dialog = null;

  constructor(
    private readonly div: HTMLDivElement,
    private readonly sendModelChangeRequests: RequestModelChangesFunc,
    private readonly sendModelInfoRequests: RequestInfoFunc,
  ) {
    const that = this;
    document.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape") {
        that.closeDialog();
      }
    });
  }

  private closeDialog(): void {
    if (this.currentDialog === null) return;

    this.div.removeChild(this.currentDialog.root);
    this.currentDialog = null;
  }

  public saveAsDialog(): void {
    if (this.currentDialog !== null) this.closeDialog();
    const dialog = new SaveAsDialog(
      () => { this.closeDialog(); },
      DialogManager.dialogWidth,
      DialogManager.dialogHeight,
      this.sendModelChangeRequests,
    );
    this.div.appendChild(dialog.root);

    this.currentDialog = dialog;
  }

  public async openDialog(): Promise<void> {
    if (this.currentDialog !== null) this.closeDialog();

    const dialog = new OpenDialog(
      () => { this.closeDialog(); },
      DialogManager.dialogWidth,
      DialogManager.dialogHeight,
      this.sendModelChangeRequests,
      this.sendModelInfoRequests,
    );
    this.div.appendChild(dialog.root);

    this.currentDialog = dialog;
  }

  public editLayerDialog(layerId: string): void {
    if (this.currentDialog !== null) this.closeDialog();

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
}
