import { Dialog } from "./dialog.js";
import { RequestModelChangesFunc, RequestVersioningChangeFunc } from "../../../messenger.js";

export class SaveAsDialog extends Dialog {
  constructor(
    closeDialogFunc: () => void,
    width: number,
    height: number,
    private readonly sendModelVersioningRequest: RequestVersioningChangeFunc,
  ) {
    super(closeDialogFunc, width, height);

    const saveAsTitle = Dialog.createTitle("Save As");
    this.root.appendChild(saveAsTitle);

    const inputDiv = document.createElement("div");
    this.root.appendChild(inputDiv);

    inputDiv.style.width = "80%";
    inputDiv.style.margin = "auto";

    const textInput = document.createElement("input");
    inputDiv.appendChild(textInput);
    textInput.placeholder = "Enter File name";
    textInput.style.width = "80%";
    textInput.style.display = "inline-block";
    textInput.addEventListener("keydown", async (ev) => {
      if (ev.key === "Enter") {
        if (textInput.value.trim() !== "") {
          this.addLoadIcon();
          await sendModelVersioningRequest({type: "saveFile", fileName: textInput.value});
          this.removeLoadIcon(); // redundant?
          closeDialogFunc(); // redundant?
          closeDialogFunc();
        }
      }
    });

    const saveButton = document.createElement("button");
    inputDiv.appendChild(saveButton);
    saveButton.style.display = "inline-block";
    saveButton.style.height = "100%";
    saveButton.textContent = "Save";
    saveButton.addEventListener("click", async () => {
      if (textInput.value.trim() !== "") {
        this.addLoadIcon();
        await sendModelVersioningRequest({type: "saveFile", fileName: textInput.value});
        this.removeLoadIcon(); // redundant?
        closeDialogFunc(); // redundant?
      }
    });
  }
}
