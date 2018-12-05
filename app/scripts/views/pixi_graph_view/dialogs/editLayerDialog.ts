import { Dialog } from "./dialog.js";
import { ModelInfoRequestType, ModelInfoRequestMap, ModelInfoResponseMap, LayerData, ModelChangeRequest } from "../../../interfaces.js";

export class EditLayerDialog extends Dialog {
  constructor(
    closeDialogFunc: () => void,
    width: number,
    height: number,
    sendModelChangeRequest: (req: ModelChangeRequest) => void,
    private readonly sendModelInfoRequest: <T extends ModelInfoRequestType>(req: ModelInfoRequestMap[T]) => ModelInfoResponseMap[T],
    layerId: string,
  ) {
    super(closeDialogFunc, width, height);

    this.root.style.overflowY = "scroll";

    const editLayerTitle = Dialog.createTitle("Edit Layer");
    this.root.appendChild(editLayerTitle);

    const layerData: LayerData = sendModelInfoRequest<"getLayerInfo">({type: "getLayerInfo", layerId: layerId}).data;

    const fieldDiv = document.createElement("div");
    this.root.appendChild(fieldDiv);

    let invalidFields: string[] = [];
    for (const fieldId in layerData.fields) {
      const row = document.createElement("div");
      fieldDiv.appendChild(row);
      row.style.marginLeft = "10px";
      row.style.marginTop = "10px";

      const label = document.createElement("div");
      row.appendChild(label);
      label.style.display = "inline-block";
      label.textContent = fieldId;
      label.style.width = "25%";
      label.style.marginLeft = "10%";

      const input = document.createElement("input");
      row.appendChild(input);
      input.style.display = "inline-block";
      input.value = layerData.fields[fieldId].value;
      input.style.width = "10em";
      input.disabled = layerData.fields[fieldId].readonly;

      input.style.padding = "3px";
      input.style.border = "1px solid black";

      const errorText = document.createElement("div");
      row.appendChild(errorText);
      errorText.style.display = "inline-block";
      errorText.style.color = "red";
      errorText.style.fontSize = "10px";
      errorText.style.marginLeft = "10px";

      input.addEventListener("input", (ev) => {
        const validateVal = sendModelInfoRequest<"validateValue">({
          type: "validateValue",
          layerId: layerId,
          valueId: fieldId,
          newValue: input.value,
        });

        if (validateVal.invalidError === null) {
          input.style.border = "1px solid black";
          input.style.padding = "3px";

          errorText.textContent = "";

          if (invalidFields.indexOf(fieldId) !== -1) {
            invalidFields.splice(invalidFields.indexOf(fieldId), 1);
          }
        } else {
          input.style.border = "3px solid red";
          input.style.padding = "1px";

          errorText.textContent = validateVal.invalidError;

          if (invalidFields.indexOf(fieldId) === -1) {
            invalidFields.push(fieldId);
          }
        }

        updateSaveButton();
      });
    }

    const saveButtonDiv = document.createElement("div");
    this.root.appendChild(saveButtonDiv);
    saveButtonDiv.style.marginTop = "20px";

    const saveButton = document.createElement("button");
    saveButtonDiv.appendChild(saveButton);
    saveButton.textContent = "Save";
    saveButton.style.margin = "0 auto";
    saveButton.style.display = "block";

    function updateSaveButton() {
      saveButton.disabled = invalidFields.length !== 0;
    }

    saveButton.addEventListener("click", () => {
      sendModelChangeRequest
    })
  }
}
