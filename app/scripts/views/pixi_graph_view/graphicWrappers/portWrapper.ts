import { GraphicWrapper } from "./graphicsWrapper.js";

export class PortWrapper extends GraphicWrapper {
  private static readonly borderWidth = 2;

  private static cachedPortTexture: PIXI.RenderTexture | null = null;
  private static createSprite(renderer: PIXI.WebGLRenderer | PIXI.CanvasRenderer): PIXI.Sprite {
    if (PortWrapper.cachedPortTexture !== null) {
      const spriteFromCachedTexture = new PIXI.Sprite(PortWrapper.cachedPortTexture);
      spriteFromCachedTexture.cacheAsBitmap = true;
      return spriteFromCachedTexture;
    }

    const graphics = new PIXI.Graphics();

    graphics.lineColor = 0x000000;
    graphics.lineWidth =PortWrapper.borderWidth;
    graphics.beginFill(0x999999);
    graphics.drawRoundedRect(
      0 + PortWrapper.borderWidth/2,
      0 + PortWrapper.borderWidth/2,
      20 + PortWrapper.borderWidth/2,
      12 + PortWrapper.borderWidth/2,
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
    sprite.cacheAsBitmap = true;
    return sprite;
  }

  private readonly isOutput: boolean;
  private readonly sprite: PIXI.Sprite;


  constructor(
    renderer: PIXI.WebGLRenderer | PIXI.CanvasRenderer,
    isOutput: boolean,
  ) {
    super({
      buttonMode: true
    });

    this.isOutput = isOutput;

    this.sprite = PortWrapper.createSprite(renderer);
    this.addChild(this.sprite);
  }

  public getIsOutput(): boolean {
    return this.isOutput;
  }
}
