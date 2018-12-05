import { ModelInfoRequestType, ModelInfoRequestMap, ModelInfoResponseMap, ModelVersioningRequest, ModelChangeRequest } from "../../../interfaces.js";
import { Dialog } from "./dialog.js";
import { EditLayerDialog } from "./editLayerDialog.js";
import { OpenDialog } from "./openDialog.js";
import { SaveAsDialog } from "./saveAsDialog.js";

export class DialogManager {
  private currentDialog: null | Dialog = null;

  constructor(
    private readonly div: HTMLDivElement,
    private readonly sendModelChangeRequest: (req: ModelChangeRequest) => void,
    private readonly sendModelInfoRequest:
      <T extends ModelInfoRequestType>(req: ModelInfoRequestMap[T]) => ModelInfoResponseMap[T],
    private readonly sendModelVersioningRequest: (req: ModelVersioningRequest) => void,
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
      this.div.clientWidth/2,
      this.div.clientHeight/2,
      (fileName: string) => {
        this.sendModelVersioningRequest({ type: "saveFile", fileName: fileName });
      },
    );
    this.div.appendChild(dialog.root);

    this.currentDialog = dialog;
  }

  public openDialog(): void {
    if (this.currentDialog !== null) this.closeDialog();

    const dialog = new OpenDialog(
      () => { this.closeDialog(); },
      this.div.clientWidth/2,
      this.div.clientHeight/2,
      this.sendModelInfoRequest<"savedFileNames">({type: "savedFileNames"}).fileNames,
      this.sendModelVersioningRequest,
    );
    this.div.appendChild(dialog.root);

    this.currentDialog = dialog;
  }

  public editLayerDialog(layerId: string): void {
    if (this.currentDialog !== null) this.closeDialog();

    const dialog = new EditLayerDialog(
      () => { this.closeDialog(); },
      this.div.clientWidth/2,
      this.div.clientHeight/2,
      this.sendModelChangeRequest,
      this.sendModelInfoRequest,
      layerId,
    );
    this.div.appendChild(dialog.root);

    this.currentDialog = dialog;
  }
}
