import { StageInterface } from "../stageInterface.js";
import { GraphicWrapper } from "./graphicWrapper.js";

export class PortWrapper extends GraphicWrapper {
  public static width = 20;
  public static height = 12;
  private static readonly texturePadding = 4;
  private static readonly borderWidth = 2;

  private static cachedPortTexture: PIXI.RenderTexture | null = null;
  private static createSprite(stageInterface: StageInterface): PIXI.Sprite {
    if (PortWrapper.cachedPortTexture !== null) {
      const spriteFromCachedTexture = new PIXI.Sprite(PortWrapper.cachedPortTexture);
      return spriteFromCachedTexture;
    }

    const graphics = new PIXI.Graphics();

    graphics.lineColor = 0x000000;
    graphics.lineStyle(PortWrapper.borderWidth);
    graphics.beginFill(0x999999);
    graphics.drawRoundedRect(
      0 + PortWrapper.texturePadding,
      0 + PortWrapper.texturePadding,
      PortWrapper.width + PortWrapper.texturePadding,
      PortWrapper.height + PortWrapper.texturePadding,
      5,
    );

    const texture = stageInterface.generateTexture(graphics);

    PortWrapper.cachedPortTexture = texture;

    const sprite = new PIXI.Sprite(texture);
    return sprite;
  }

  private readonly isOutput: boolean;
  private readonly sprite: PIXI.Sprite;

  constructor(
    stageInterface: StageInterface,
    isOutput: boolean,
  ) {
    super({
      buttonMode: true,
    });

    this.isOutput = isOutput;

    this.sprite = PortWrapper.createSprite(stageInterface);
    this.addChild(this.sprite);
    this.sprite.position.set(-PortWrapper.texturePadding);
  }

  public getIsOutput(): boolean {
    return this.isOutput;
  }
}