import { StageInterface } from "../stageInterface.js";
import { GraphicWrapper } from "./graphicWrapper.js";

export class LabelWrapper extends GraphicWrapper {
  // @WARNING @TODO problems if there are too many different label strings
  private static readonly cachedLabels = new Map<string, PIXI.RenderTexture>();

  /**
   * Creates a PIXI sprite label for the given text.
   * @param stageInterface - The stage interface
   * @param labelText - The text for the label to contain
   * @returns The generated pixi sprite
   */
  private static createLabel(
    stageInterface: StageInterface,
    labelText: string,
  ): PIXI.Sprite {
    if (LabelWrapper.cachedLabels.has(labelText)) {
      const sprite = new PIXI.Sprite(LabelWrapper.cachedLabels.get(labelText)!);
      return sprite;
    }

    const textStyle = new PIXI.TextStyle({
      fontFamily: "Arial",
      fontSize: 30,
      // fontStyle: 'italic',
      fontWeight: "bold",
      // fill: "#ffffff",
      // stroke: "#4a1850",
      // strokeThickness: 5,
      // dropShadow: true,
      // dropShadowColor: "#000000",
      // dropShadowBlur: 4,
      // dropShadowAngle: Math.PI / 6,
      // dropShadowDistance: 6,
      // wordWrap: true,
      // wordWrapWidth: 440,
    });

    const label = new PIXI.Text(labelText, textStyle);

    const texture = stageInterface.generateTexture(label);

    LabelWrapper.cachedLabels.set(labelText, texture);

    return LabelWrapper.createLabel(stageInterface, labelText);
  }

  private text: string | null = null;
  private sprite: PIXI.Sprite | null = null;

  /**
   * Constructs a label wrapper
   * @param stageInterface - The stage interface
   */
  constructor(
    private readonly stageInterface: StageInterface,
  ) {
    super();
  }

  /**
   * Gives the width of the label.
   * @returns The label width
   */
  public getWidth(): number {
    return this.sprite === null ? 0 : this.sprite.width;
  }

  /**
   * Gives the height of the label.
   * @returns the label width
   */
  public getHeight(): number {
    return this.sprite === null ? 0 : this.sprite.height;
  }

  /**
   * Sets the text of the label and updates label.
   * @param text - The new text for the label
   */
  public setText(text: string): void {
    if (this.text !== text) {
      if (this.sprite !== null) {
        this.removeChild(this.sprite);
      }

      this.sprite = LabelWrapper.createLabel(this.stageInterface, text);
      this.addChild(this.sprite);
      this.text = text;
    }
  }
}
