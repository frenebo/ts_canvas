import { MONOSPACE_STYLE } from "../../constants.js";
import {
  RequestInfoFunc,
  RequestModelChangesFunc,
} from "../../messenger.js";
import { Dialog } from "./dialog.js";

export class EditLayerDialog extends Dialog {
  private applyButton!: HTMLButtonElement;
  private updateErrorDiv!: HTMLDivElement;
  private readonly inputFields: {[key: string]: HTMLInputElement} = {};
  private layerNonexistentDiv: HTMLDivElement | null = null;
  private fieldNonexistentDiv: HTMLDivElement | null = null;

  private readonly invalidFields = new Set<string>();
  private readonly pendingFields = new Set<string>();

  private readonly fieldsReadonlyDict: {
    [key: string]: {isReadonly: boolean};
  } = {};

  /**
   * Constructs an edit layer dialog.
   * @param closeDialogFunc - A function the dialog can call to close itself
   * @param width - The width of the dialog
   * @param height - The height of the dialog
   * @param sendModelChangeRequests - An asynchronous function to request changes to the model
   * @param sendModelInfoRequests - An asynchronous function to request info from the model
   * @param layerId - The id of the layer the dialog is for
   */
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

  /**
   * Tells the user that the layer which this dialog is for does not exist.
   */
  private alertLayerNonexistent() {
    if (this.layerNonexistentDiv === null) {
      this.layerNonexistentDiv = document.createElement("div");
      this.root.appendChild(this.layerNonexistentDiv);
      this.layerNonexistentDiv.style.textAlign = "center";
      this.layerNonexistentDiv.style.marginTop = "10px";
      this.layerNonexistentDiv.textContent = "Layer no longer exists";
    }
  }

  /**
   * Tells the user that the dialog couldn't get the values of one of the fields.
   * 
   * @remarks
   * This should never get called, should probably be removed
   * 
   * @param fieldName 
   */
  private alertFieldNonexistent(fieldName: string) {
    if (this.fieldNonexistentDiv === null) {
      this.fieldNonexistentDiv = document.createElement("div");
      this.root.appendChild(this.fieldNonexistentDiv);
      this.fieldNonexistentDiv.style.textAlign = "center";
      this.fieldNonexistentDiv.style.marginTop = "10px";
      this.fieldNonexistentDiv.textContent = `Field does ${fieldName} not exist`;
    }
  }

  /**
   * Asynchronously initializes the dialog.
   */
  private async init(): Promise<void> {
    this.root.style.overflowY = "scroll";

    const editLayerTitle = Dialog.createTitle("Edit Layer");
    this.root.appendChild(editLayerTitle);

    this.addLoadIcon();
    const layerInfoResponse = await this.sendModelInfoRequests<"getLayerInfo">({
      layerId: this.layerId,
      type: "getLayerInfo",
    });
    this.removeLoadIcon();
    if (!layerInfoResponse.layerExists) {
      this.alertLayerNonexistent();
      return;
    }
    const layerData = layerInfoResponse.data;

    const fieldDiv = document.createElement("div");
    this.root.appendChild(fieldDiv);

    for (const fieldId of Object.keys(layerData.fields)) {
      // const fieldReadonlyInfo = await this.sendModelInfoRequests<"valueIsReadonly">({
      //   layerId: this.layerId,
      //   type: "valueIsReadonly",
      //   valueId: fieldId,
      // });

      this.fieldsReadonlyDict[fieldId] = {isReadonly: layerInfoResponse.data.fields[fieldId].fieldIsReadonly};

      const row = this.createFieldRow(fieldId, layerData.fields[fieldId].value);
      fieldDiv.appendChild(row);
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

    this.applyButton.addEventListener("click", () => {
      this.applyValues().catch(() => {
        // @TODO?
      });
    });
  }

  /**
   * Creates a row for editing a layer field.
   * @param fieldName - The name to show for the field.
   * @param value - The string value of the field.
   * @returns The HTMLDivElement containing the row.
   */
  private createFieldRow(fieldName: string, value: string): HTMLDivElement {
    const row = document.createElement("div");
    row.style.marginLeft = "10px";
    row.style.marginTop = "10px";

    const label = document.createElement("div");
    row.appendChild(label);
    label.style.display = "inline-block";
    label.textContent = fieldName;
    label.style.width = "25%";
    label.style.marginLeft = "10%";

    const input = document.createElement("input");
    row.appendChild(input);
    this.inputFields[fieldName] = input;
    input.style.display = "inline-block";
    input.style.width = "10em";
    input.style.padding = "3px";
    input.style.border = "1px solid black";
    input.style.fontFamily = MONOSPACE_STYLE;
    input.value = value;

    const errorText = document.createElement("div");
    row.appendChild(errorText);
    errorText.style.display = "inline-block";
    errorText.style.color = "red";
    errorText.style.fontSize = "10px";
    errorText.style.marginLeft = "10px";

    if (this.fieldsReadonlyDict[fieldName].isReadonly) {
      input.disabled = true;
      input.style.backgroundColor = "#999999";
    }

    let currentValidation: {
      promise: Promise<IModelInfoReqs["validateValue"]["response"]>;
      loadIcon: HTMLDivElement;
    } | null = null;

    const beginOrReplaceValidation = (promise: Promise<IModelInfoReqs["validateValue"]["response"]>) => {
      if (currentValidation === null) {
        const icon = Dialog.createSmallLoadIcon();
        row.appendChild(icon);
        icon.style.marginBottom = `${row.clientHeight / 2}px`;
        icon.style.display = "inline-block";
        errorText.textContent = "";
        this.pendingFields.add(fieldName);
        currentValidation = {
          loadIcon: icon,
          promise: promise,
        };
      } else {
        currentValidation.promise = promise;
      }
      this.updateApplyButton();
    };

    const isPromiseCurrentValidation = (promise: Promise<IModelInfoReqs["validateValue"]["response"]>) => {
      return currentValidation !== null && currentValidation.promise === promise;
    };

    const endValidation = (validateVal: IModelInfoReqs["validateValue"]["response"]) => {
      if (currentValidation === null) {
        return;
      }

      row.removeChild(currentValidation.loadIcon);

      currentValidation = null; // setting to null
      this.pendingFields.delete(fieldName);

      if (validateVal.requestError === "layer_nonexistent") {
        this.alertLayerNonexistent();
        return;
      } else if (validateVal.requestError === "field_nonexistent") {
        this.alertFieldNonexistent(validateVal.fieldName);
        return;
      }

      if (validateVal.fieldValidationError === null) {
        input.style.border = "1px solid black";
        input.style.padding = "3px";

        errorText.textContent = "";

        if (this.invalidFields.has(fieldName)) {
          this.invalidFields.delete(fieldName);
        }
      } else {
        input.style.border = "3px solid red";
        input.style.padding = "1px";

        errorText.textContent = validateVal.fieldValidationError;

        if (!this.invalidFields.has(fieldName)) {
          this.invalidFields.add(fieldName);
        }
      }

      this.updateApplyButton();
    };

    input.addEventListener("input", async () => {
      const thisPromise = this.sendModelInfoRequests<"validateValue">({
        layerId: this.layerId,
        newValue: input.value,
        type: "validateValue",
        valueId: fieldName,
      });

      beginOrReplaceValidation(thisPromise);

      const validateVal = await thisPromise;

      if (!isPromiseCurrentValidation(thisPromise)) {
        return;
      } else {
        endValidation(validateVal);
      }
    });

    return row;
  }

  /**
   * Updates whether or not the "apply" button is clickable.
   */
  private updateApplyButton(): void {
    this.applyButton.disabled = (this.invalidFields.size !== 0) || (this.pendingFields.size !== 0);
  }

  /**
   * Uses the values in the fields to request the server to update the layer.
   */
  private async applyValues(): Promise<void> {
    this.addLoadIcon();
    this.applyButton.disabled = true;
    const setFieldValues: {[key: string]: string} = {};
    for (const fieldId in this.inputFields) {
      if (!this.fieldsReadonlyDict[fieldId].isReadonly) {
        setFieldValues[fieldId] = this.inputFields[fieldId].value;
      }
    }
    const validated = await this.sendModelInfoRequests<"validateLayerFields">({
      fieldValues: setFieldValues,
      layerId: this.layerId,
      type: "validateLayerFields",
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
          fieldValues: setFieldValues,
          layerId: this.layerId,
          type: "setLayerFields",
        }).catch(() => {
          // @TODO
        });

        const newInfo = await this.sendModelInfoRequests<"getLayerInfo">({
          layerId: this.layerId,
          type: "getLayerInfo",
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
