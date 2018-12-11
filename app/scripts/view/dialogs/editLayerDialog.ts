import { Dialog } from "./dialog.js";
import {
  ModelChangeRequest,
  ModelInfoReqs,
} from "../../interfaces.js";
import { RequestModelChangesFunc, RequestInfoFunc } from "../../messenger.js";
import { MONOSPACE_STYLE } from "../../constants.js";

export class EditLayerDialog extends Dialog {
  private applyButton!: HTMLButtonElement;
  private updateErrorDiv!: HTMLDivElement;
  private readonly inputFields: {[key: string]: HTMLInputElement} = {};

  private readonly invalidFields = new Set<string>();
  private readonly pendingFields = new Set<string>();

  private readonly fieldsReadonlyDict: {
    [key: string]: boolean
  } = {};


  constructor(
    closeDialogFunc: () => void,
    width: number,
    height: number,
    private readonly sendModelChangeRequests: RequestModelChangesFunc,
    private readonly sendModelInfoRequests: RequestInfoFunc,
    private readonly layerId: string,
  ) {
    super(closeDialogFunc, width, height);
    this.init().catch((reason) => {
      throw new Error(`Failed to init dialog: ${reason}`);
    });
  }

  private layerNonexistentDiv: HTMLDivElement | null = null;
  private alertLayerNonexistent() {
    if (this.layerNonexistentDiv === null) {
      this.layerNonexistentDiv = document.createElement("div");
      this.root.appendChild(this.layerNonexistentDiv);
      this.layerNonexistentDiv.style.textAlign = "center";
      this.layerNonexistentDiv.style.marginTop = "10px";
      this.layerNonexistentDiv.textContent = "Layer no longer exists";
    }
  }

  private fieldNonexistentDiv: HTMLDivElement | null = null;
  private alertFieldNonexistent(fieldName: string) {
    if (this.fieldNonexistentDiv === null) {
      this.fieldNonexistentDiv = document.createElement("div");
      this.root.appendChild(this.fieldNonexistentDiv);
      this.fieldNonexistentDiv.style.textAlign = "center";
      this.fieldNonexistentDiv.style.marginTop = "10px";
      this.fieldNonexistentDiv.textContent = `Field does ${fieldName} not exist`;
    }
  }

  private async init() {
    this.root.style.overflowY = "scroll";

    const editLayerTitle = Dialog.createTitle("Edit Layer");
    this.root.appendChild(editLayerTitle);

    this.addLoadIcon();
    const layerInfoResponse = await this.sendModelInfoRequests<"getLayerInfo">({
      type: "getLayerInfo",
      layerId: this.layerId,
    });
    this.removeLoadIcon();
    if (!layerInfoResponse.layerExists) {
      this.alertLayerNonexistent();
      return;
    }
    const layerData = layerInfoResponse.data;

    const fieldDiv = document.createElement("div");
    this.root.appendChild(fieldDiv);

    for (const fieldId in layerData.fields) {
      const fieldReadonlyInfo = await this.sendModelInfoRequests<"valueIsReadonly">({
        type: "valueIsReadonly",
        layerId: this.layerId,
        valueId: fieldId,
      });

      if (fieldReadonlyInfo.requestError === "layer_nonexistent") {
        this.alertLayerNonexistent();
        break;
      } else if (fieldReadonlyInfo.requestError === "field_nonexistent") {
        this.alertFieldNonexistent(fieldId);
        break;
      }

      this.fieldsReadonlyDict[fieldId] = fieldReadonlyInfo.isReadonly;
    }
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
      this.inputFields[fieldId] = input;
      input.style.display = "inline-block";
      input.value = layerData.fields[fieldId].value;
      input.style.width = "10em";


      input.disabled = this.fieldsReadonlyDict[fieldId];

      input.style.padding = "3px";
      input.style.border = "1px solid black";
      input.style.fontFamily = MONOSPACE_STYLE;

      const errorText = document.createElement("div");
      row.appendChild(errorText);
      errorText.style.display = "inline-block";
      errorText.style.color = "red";
      errorText.style.fontSize = "10px";
      errorText.style.marginLeft = "10px";

      let currentValidation: {
        promise: Promise<ModelInfoReqs["validateValue"]["response"]>;
        loadIcon: HTMLDivElement;
      } | null = null;

      input.addEventListener("input", async (ev) => {
        const thisPromise = this.sendModelInfoRequests<"validateValue">({
          type: "validateValue",
          layerId: this.layerId,
          valueId: fieldId,
          newValue: input.value,
        });
        if (currentValidation === null) {
          const icon = Dialog.createSmallLoadIcon();
          row.appendChild(icon);
          icon.style.display = "inline-block";
          errorText.textContent = "";
          currentValidation = {
            promise: thisPromise,
            loadIcon: icon,
          };
          this.pendingFields.add(fieldId);
        } else {
          currentValidation.promise = thisPromise;
        }

        this.updateApplyButton();

        const validateVal = await thisPromise;

        // if a new value has started validation during the await period
        if (currentValidation.promise !== thisPromise) {
          return;
        }

        row.removeChild(currentValidation.loadIcon);

        currentValidation = null; // setting to null
        this.pendingFields.delete(fieldId);

        if (validateVal.requestError === "layer_nonexistent") {
          this.alertLayerNonexistent();
          return;
        } else if (validateVal.requestError === "field_nonexistent") {
          this.alertFieldNonexistent(validateVal.fieldName);
          return;
        }

        if (validateVal.invalidError === null) {
          input.style.border = "1px solid black";
          input.style.padding = "3px";

          errorText.textContent = "";

          if (this.invalidFields.has(fieldId)) {
            this.invalidFields.delete(fieldId);
          }
        } else {
          input.style.border = "3px solid red";
          input.style.padding = "1px";

          errorText.textContent = validateVal.invalidError;

          if (!this.invalidFields.has(fieldId)) {
            this.invalidFields.add(fieldId);
          }
        }

        this.updateApplyButton();
      });
    }

    this.updateErrorDiv = document.createElement("div");
    this.root.appendChild(this.updateErrorDiv);
    this.updateErrorDiv.style.color = "red";
    this.updateErrorDiv.style.textAlign = "center";
    this.updateErrorDiv.style.marginTop = "10px";

    const saveButtonDiv = document.createElement("div");
    this.root.appendChild(saveButtonDiv);
    saveButtonDiv.style.marginTop = "10px";

    this.applyButton = document.createElement("button");
    saveButtonDiv.appendChild(this.applyButton);
    this.applyButton.textContent = "Apply";
    this.applyButton.style.margin = "0 auto";
    this.applyButton.style.display = "block";

    this.applyButton.addEventListener("click", () => this.applyValues());
  }

  private updateApplyButton() {
    this.applyButton.disabled = (this.invalidFields.size !== 0) || (this.pendingFields.size !== 0);
  }

  private async applyValues() {
    this.addLoadIcon();
    this.applyButton.disabled = true;
    const setFieldValues: {[key: string]: string} = {};
    for (const fieldId in this.inputFields) {
      if (!this.fieldsReadonlyDict[fieldId]) {
        setFieldValues[fieldId] = this.inputFields[fieldId].value;
      }
    }
    const validated = await this.sendModelInfoRequests<"validateLayerFields">({
      type: "validateLayerFields",
      layerId: this.layerId,
      fieldValues: setFieldValues,
    });

    if (validated.requestError === "layer_nonexistent") {
      this.alertLayerNonexistent();
    } else if (validated.requestError === "field_nonexistent") {
      this.alertFieldNonexistent(validated.fieldName);
    } else {
      let errorText = validated.errors.length === 0 ? "" : validated.errors.length === 1 ? "Error: " : "Errors: ";
      errorText += validated.errors.join(", ");

      this.updateErrorDiv.textContent = errorText;

      if (validated.errors.length === 0) {
        this.sendModelChangeRequests({
          type: "setLayerFields",
          layerId: this.layerId,
          fieldValues: setFieldValues,
        }).catch(() => {
          // @TODO
        });

        const newInfo = await this.sendModelInfoRequests<"getLayerInfo">({
          type: "getLayerInfo",
          layerId: this.layerId,
        });

        if (!newInfo.layerExists) {
          this.alertLayerNonexistent();
        } else {
          const newFields = newInfo.data.fields;

          for (const fieldId in newFields) {
            if (this.inputFields[fieldId].value !== newFields[fieldId].value) {
              this.inputFields[fieldId].value = newFields[fieldId].value;
            }
          }
        }
      }
      this.removeLoadIcon();
      this.applyButton.disabled = false;
    }
  }
}
