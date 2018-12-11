import { BACKGROUND_TILE_PATH } from "../../constants.js";

export class BackgroundWrapper {
  private readonly tilingBackground: PIXI.extras.TilingSprite;
  constructor(
    renderer: PIXI.WebGLRenderer | PIXI.CanvasRenderer,
  ) {
    const texture = PIXI.Texture.fromImage(BACKGROUND_TILE_PATH);
    this.tilingBackground = new PIXI.extras.TilingSprite(texture, renderer.width, renderer.height);
    this.tilingBackground.interactive = true;
  }

  public getDisplayObject(): PIXI.DisplayObject {
    return this.tilingBackground;
  }

  public setDimensions(w: number, h: number): void {
    this.tilingBackground.width = w;
    this.tilingBackground.height = h;
  }

  public setPosition(x: number, y: number): void {
    this.tilingBackground.tilePosition.set(x, y);
  }

  public setScale(scale: number): void {
    this.tilingBackground.tileScale.set(scale);
  }
}
