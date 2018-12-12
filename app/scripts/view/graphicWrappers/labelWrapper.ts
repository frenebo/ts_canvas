import { StageInterface } from "../stageInterface.js";
import { GraphicWrapper } from "./graphicWrapper.js";

export class LabelWrapper extends GraphicWrapper {
  private static readonly cachedLabels = new Map<string, PIXI.RenderTexture>();
  private static drawLabel(
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

    return LabelWrapper.drawLabel(stageInterface, labelText);
  }

  private text: string | null = null;
  private sprite: PIXI.Sprite | null = null;
  constructor(
    private readonly stageInterface: StageInterface,
  ) {
    super({});
  }

  public getWidth(): number {
    return this.sprite === null ? 0 : this.sprite.width;
  }

  public getHeight(): number {
    return this.sprite === null ? 0 : this.sprite.height;
  }

  public setText(text: string): void {
    if (this.text !== text) {
      if (this.sprite !== null) {
        this.removeChild(this.sprite);
      }

      this.sprite = LabelWrapper.drawLabel(this.stageInterface, text);
      this.addChild(this.sprite);
      this.text = text;
    }
  }
}
