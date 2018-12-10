import { GraphicWrapper } from "./graphicWrapper.js";

export class PortWrapper extends GraphicWrapper {
  private static readonly texturePadding = 4;
  private static readonly borderWidth = 2;
  public static width = 20;
  public static height = 12;

  private static cachedPortTexture: PIXI.RenderTexture | null = null;
  private static createSprite(renderer: PIXI.WebGLRenderer | PIXI.CanvasRenderer): PIXI.Sprite {
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

    const texture = renderer.generateTexture(
      graphics,
      undefined, // scale mode
      renderer.resolution*4, // resolution
      undefined, // region
    );

    PortWrapper.cachedPortTexture = texture;

    const sprite = new PIXI.Sprite(texture);
    return sprite;
  }

  private readonly isOutput: boolean;
  private readonly sprite: PIXI.Sprite;


  constructor(
    renderer: PIXI.WebGLRenderer | PIXI.CanvasRenderer,
    isOutput: boolean,
  ) {
    super({
      buttonMode: true,
    });

    this.isOutput = isOutput;

    this.sprite = PortWrapper.createSprite(renderer);
    this.addChild(this.sprite);
    this.sprite.position.set(-PortWrapper.texturePadding);
  }

  public getIsOutput(): boolean {
    return this.isOutput;
  }
}
