import { GraphicWrapper } from "./graphicWrapper.js";

export class VtxBackgroundWrapper extends GraphicWrapper {
  private static readonly cachedTextures = new Map<string, PIXI.RenderTexture>();

  private static readonly unselectedFillColor = 0xE6E6E6;
  private static readonly selectedFillColor = 0xFFFF00;
  private static readonly borderColor = 0x333333;
  private static readonly borderWidth = 5;
  public static readonly backgroundSpritePadding = 5;

  private static drawSprite(
    renderer: PIXI.WebGLRenderer | PIXI.CanvasRenderer,
    selected: boolean,
    width: number,
    height: number,
    alpha: number,
  ): PIXI.Sprite {
    const uniqueString = `${selected},${width},${height},${alpha}`;
    if (VtxBackgroundWrapper.cachedTextures.has(uniqueString)) {
      const sprite = new PIXI.Sprite(
        VtxBackgroundWrapper.cachedTextures.get(uniqueString),
      );
      return sprite;
    }

    const graphics = new PIXI.Graphics();
    const fillColor = selected ? VtxBackgroundWrapper.selectedFillColor : VtxBackgroundWrapper.unselectedFillColor;
    graphics.beginFill(fillColor, alpha);
    graphics.lineStyle(VtxBackgroundWrapper.borderWidth, VtxBackgroundWrapper.borderColor);
    graphics.drawRoundedRect(
      VtxBackgroundWrapper.backgroundSpritePadding,
      VtxBackgroundWrapper.backgroundSpritePadding,
      width + VtxBackgroundWrapper.backgroundSpritePadding,
      height + VtxBackgroundWrapper.backgroundSpritePadding,
      10,
    );

    const texture = renderer.generateTexture(
      graphics,
      undefined, // scale mode
      renderer.resolution*4, // resolution
      undefined, // region
    );
    VtxBackgroundWrapper.cachedTextures.set(uniqueString, texture);

    return VtxBackgroundWrapper.drawSprite(
      renderer,
      selected,
      width,
      height,
      alpha,
    );
  }

  private sprite: PIXI.Sprite | null = null;
  private selected: boolean | null = null;
  private width: number | null = null;
  private height: number | null = null;
  private alpha: number | null = null;

  constructor(
    private readonly renderer: PIXI.WebGLRenderer | PIXI.CanvasRenderer,
  ) {
    super({});
  }

  public redraw(
    selected: boolean,
    width: number,
    height: number,
    alpha: number,
  ): void {
    if (
      selected !== this.selected ||
      width !== this.width ||
      height !== this.height ||
      alpha !== this.alpha
    ) {
      this.selected = selected;
      this.width = width;
      this.height = height;
      this.alpha = alpha;
      if (this.sprite !== null) this.removeChild(this.sprite);
      this.sprite = VtxBackgroundWrapper.drawSprite(
        this.renderer,
        this.selected,
        this.width,
        this.height,
        this.alpha,
      );
      this.sprite.position.set(-VtxBackgroundWrapper.backgroundSpritePadding);
      this.addChild(this.sprite);
    }
  }
}