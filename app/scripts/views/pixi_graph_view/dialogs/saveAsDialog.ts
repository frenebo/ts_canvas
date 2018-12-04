import { Dialog } from "./dialogs.js";

export class SaveAsDialog extends Dialog {
  constructor(
    closeDialogFunc: () => void,
    div: HTMLDivElement,
    width: number,
    height: number,
    saveFunc: (fileName: string) => void,
  ) {
    super(closeDialogFunc, div, width, height);

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
          saveFunc(textInput.value);
          closeDialogFunc();
        }
      }
    });
    textInput.focus();

    const saveButton = document.createElement("button");
    inputDiv.appendChild(saveButton);
    saveButton.style.display = "inline-block";
    saveButton.style.height = "100%";
    saveButton.textContent = "Save";
    saveButton.addEventListener("click", () => {
      if (textInput.value.trim() !== "") {
        saveFunc(textInput.value);
        closeDialogFunc();
      }
    });
  }
}
