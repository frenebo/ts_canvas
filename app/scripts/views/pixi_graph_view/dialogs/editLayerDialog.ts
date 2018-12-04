import { Dialog } from "./dialogs.js";

export class EditLayerDialog extends Dialog {
  constructor(
    closeDialogFunc: () => void,
    div: HTMLDivElement,
    width: number,
    height: number
  ) {
    super(closeDialogFunc, div, width, height);

    const editLayerTitle = Dialog.createTitle("Edit Layer");
    this.root.appendChild(editLayerTitle);


  }
}
