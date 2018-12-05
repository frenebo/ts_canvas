import { Dialog } from "./dialog.js";
import { ModelVersioningRequest } from "../../../interfaces.js";

export class SaveAsDialog extends Dialog {
  constructor(
    closeDialogFunc: () => void,
    width: number,
    height: number,
    sendModelVersioningRequest: (req: ModelVersioningRequest) => void,
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
    textInput.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") {
        if (textInput.value.trim() !== "") {
          sendModelVersioningRequest({type: "saveFile", fileName: textInput.value});
          closeDialogFunc();
        }
      }
    });

    const saveButton = document.createElement("button");
    inputDiv.appendChild(saveButton);
    saveButton.style.display = "inline-block";
    saveButton.style.height = "100%";
    saveButton.textContent = "Save";
    saveButton.addEventListener("click", () => {
      if (textInput.value.trim() !== "") {
        sendModelVersioningRequest({type: "saveFile", fileName: textInput.value});
        closeDialogFunc();
      }
    });
  }
}
