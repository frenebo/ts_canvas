import { Dialog } from "./dialog.js";
import { ModelInfoRequestType, ModelInfoRequestMap, ModelInfoResponseMap, LayerData, ModelChangeRequest } from "../../../interfaces.js";

export class EditLayerDialog extends Dialog {
  constructor(
    closeDialogFunc: () => void,
    width: number,
    height: number,
    private readonly sendModelChangeRequests: (...reqs: ModelChangeRequest[]) => void,
    private readonly sendModelInfoRequest: <T extends ModelInfoRequestType>(req: ModelInfoRequestMap[T]) => Promise<ModelInfoResponseMap[T]>,
    private readonly layerId: string,
  ) {
    super(closeDialogFunc, width, height);
    this.init();
  }

  private alertLayerNonexistent() {
    const layerNonexistentDiv = document.createElement("div");
    this.root.appendChild(layerNonexistentDiv);
    layerNonexistentDiv.style.textAlign = "center";
    layerNonexistentDiv.style.marginTop = "10px";
    layerNonexistentDiv.textContent = "Layer does not exist";
  }

  private async init() {
    this.root.style.overflowY = "scroll";

    const editLayerTitle = Dialog.createTitle("Edit Layer");
    this.root.appendChild(editLayerTitle);

    const layerInfoResponse = await this.sendModelInfoRequest<"getLayerInfo">({type: "getLayerInfo", layerId: this.layerId});
    if (!layerInfoResponse.layerExists) {
      this.alertLayerNonexistent();
      return;
    }
    const layerData = layerInfoResponse.data;

    const fieldDiv = document.createElement("div");
    this.root.appendChild(fieldDiv);

    let invalidFields: string[] = [];
    const inputFields: {[key: string]: HTMLInputElement} = {};
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
      inputFields[fieldId] = input;
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

      input.addEventListener("input", async (ev) => {
        const validateVal = await this.sendModelInfoRequest<"validateValue">({
          type: "validateValue",
          layerId: this.layerId,
          valueId: fieldId,
          newValue: input.value,
        });

        validateVal

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

        updateApplyButton();
      });
    }

    const updateErrorDiv = document.createElement("div");
    this.root.appendChild(updateErrorDiv);
    updateErrorDiv.style.color = "red";
    updateErrorDiv.style.textAlign = "center";
    updateErrorDiv.style.marginTop = "10px";

    const saveButtonDiv = document.createElement("div");
    this.root.appendChild(saveButtonDiv);
    saveButtonDiv.style.marginTop = "10px";

    const applyButton = document.createElement("button");
    saveButtonDiv.appendChild(applyButton);
    applyButton.textContent = "Apply";
    applyButton.style.margin = "0 auto";
    applyButton.style.display = "block";

    function updateApplyButton() {
      applyButton.disabled = invalidFields.length !== 0;
    }

    applyButton.addEventListener("click", async () => {
      const setFieldValues: {[key: string]: string} = {};
      for (const fieldId in inputFields) {
        if (!layerData.fields[fieldId].readonly) {
          setFieldValues[fieldId] = inputFields[fieldId].value;
        }
      }

      const validated = await this.sendModelInfoRequest<"validateLayerFields">({
        type: "validateLayerFields",
        layerId: this.layerId,
        fieldValues: setFieldValues,
      });

      if (validated.requestError === "layer_nonexistent") {
        this.alertLayerNonexistent();
        return;
      }
      if (validated.requestError === "field_nonexistent") {
        this.alertFieldNonexistent(validated.fieldName);
      }

      let errorText = validated.errors.length === 0 ? "" : validated.errors.length === 1 ? "Error: " : "Errors: ";
      errorText += validated.errors.join(", ");

      updateErrorDiv.textContent = errorText;

      if (validated.errors.length === 0) {
        this.sendModelChangeRequests({
          type: "setLayerFields",
          layerId: this.layerId,
          fieldValues: setFieldValues,
        });

        const newInfo = await this.sendModelInfoRequest<"getLayerInfo">({
          type: "getLayerInfo",
          layerId: this.layerId
        });
        if (!newInfo.layerExists) {
          this.alertLayerNonexistent();
          return;
        }

        const newFields = newInfo.data.fields;

        for (const fieldId in newFields) {
          if (inputFields[fieldId].value !== newFields[fieldId].value) {
            inputFields[fieldId].value = newFields[fieldId].value
          }
        }
      }
    });
  }
}
