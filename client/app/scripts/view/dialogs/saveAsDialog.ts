import { MONOSPACE_STYLE } from "../../constants.js";
import { RequestVersioningChangeFunc } from "../../messenger.js";
import { Dialog } from "./dialog.js";

export class SaveAsDialog extends Dialog {
  /**
   * Constructs a "save as" dialog.
   * @param closeDialogFunc - A function the dialog can call to close itself
   * @param width - The width of the dialog
   * @param height - The height of the dialog
   * @param sendModelVersioningRequest - An asynchronous function to request versioning change to the model
   */
  constructor(
    closeDialogFunc: () => void,
    width: number,
    height: number,
    sendModelVersioningRequest: RequestVersioningChangeFunc,
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
    textInput.style.fontFamily = MONOSPACE_STYLE;
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
        saveButton.disabled = true;
        await sendModelVersioningRequest({type: "saveFile", fileName: textInput.value});
        this.removeLoadIcon();
        saveButton.disabled = false;
        closeDialogFunc();
      }
    });
  }
}
