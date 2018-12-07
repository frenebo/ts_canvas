import {
  ModelVersioningRequest,
  ModelChangeRequest,
  ModelInfoReqs
} from "../../../interfaces.js";
import { Dialog } from "./dialog.js";
import { EditLayerDialog } from "./editLayerDialog.js";
import { OpenDialog } from "./openDialog.js";
import { SaveAsDialog } from "./saveAsDialog.js";

export class DialogManager {
  private static readonly dialogWidth = 700;
  private static readonly dialogHeight = 500;

  private currentDialog: null | Dialog = null;

  constructor(
    private readonly div: HTMLDivElement,
    private readonly sendModelChangeRequest: (...reqs: ModelChangeRequest[]) => Promise<boolean>,
    private readonly sendModelInfoRequest: <T extends keyof ModelInfoReqs>(req: ModelInfoReqs[T]["request"]) => Promise<ModelInfoReqs[T]["response"]>,
    private readonly sendModelVersioningRequest: (req: ModelVersioningRequest) => Promise<boolean>,
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
    console.log(this.div.clientWidth);
    console.log(this.div.clientHeight);
    const dialog = new SaveAsDialog(
      () => { this.closeDialog(); },
      DialogManager.dialogWidth,
      DialogManager.dialogHeight,
      this.sendModelVersioningRequest,
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
      this.sendModelInfoRequest,
      this.sendModelVersioningRequest,
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
      this.sendModelChangeRequest,
      this.sendModelInfoRequest,
      layerId,
    );
    this.div.appendChild(dialog.root);

    this.currentDialog = dialog;
  }
}
