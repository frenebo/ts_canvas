import { BACKGROUND_TILE_PATH } from "../../constants.js";

/** Class that wraps the background of a graph */
export class BackgroundWrapper {
  private readonly tilingBackground: PIXI.extras.TilingSprite;

  /**
   * Constructs a background wrapper.
   * @param renderer - The PIXI renderer for the app
   */
  constructor(
    renderer: PIXI.WebGLRenderer | PIXI.CanvasRenderer,
  ) {
    const texture = PIXI.Texture.fromImage(BACKGROUND_TILE_PATH);
    this.tilingBackground = new PIXI.extras.TilingSprite(texture, renderer.width, renderer.height);
    this.tilingBackground.interactive = true;
  }

  /**
   * Returns the display object of the background.
   * @returns The display object of the background
   */
  public getDisplayObject(): PIXI.DisplayObject {
    return this.tilingBackground;
  }

  /**
   * Sets the tiling dimensions of the background.
   * @param w - The new width
   * @param h - The new height
   */
  public setDimensions(w: number, h: number): void {
    this.tilingBackground.width = w;
    this.tilingBackground.height = h;
  }

  /**
   * Sets the position of the background.
   * @param x - The new X position of the background
   * @param y - The new Y position of the background
   */
  public setPosition(x: number, y: number): void {
    this.tilingBackground.tilePosition.set(x, y);
  }

  /**
   * Sets the tiling scale of the background.
   * @param scale - The new scale of the background
   */
  public setScale(scale: number): void {
    this.tilingBackground.tileScale.set(scale);
  }
}
