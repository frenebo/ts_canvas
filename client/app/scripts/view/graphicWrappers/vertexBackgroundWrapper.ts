import { StageInterface } from "../stageInterface.js";
import { GraphicWrapper } from "./graphicWrapper.js";

/** Class for wrapping the background graphic of a vertex */
export class VtxBackgroundWrapper extends GraphicWrapper {
  public static readonly backgroundSpritePadding = 5;
  private static readonly cachedTextures = new Map<string, PIXI.RenderTexture>();

  private static readonly unselectedFillColor = 0xE6E6E6;
  private static readonly selectedFillColor = 0xFFFF00;
  private static readonly borderColor = 0x333333;
  private static readonly borderWidth = 5;

  /**
   * Draws a PIXI sprite for a vertex background
   * @param stageInterface - The stage interface
   * @param selected - Whether or not the vertex background is for a selected vertex
   * @param width - The width of the vertex background
   * @param height - The height of the vertex background
   * @param alpha - The opacity value for the vertex background
   * @returns The generated PIXI sprite
   */
  private static drawSprite(
    stageInterface: StageInterface,
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

    const texture = stageInterface.generateTexture(graphics);
    VtxBackgroundWrapper.cachedTextures.set(uniqueString, texture);

    return VtxBackgroundWrapper.drawSprite(
      stageInterface,
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

  /**
   * Constructs a vertex background wrapper.
   * @param stageInterface - The stage interface
   */
  constructor(
    private readonly stageInterface: StageInterface,
  ) {
    super();
  }

  /**
   * Redraws the vertex background wrapper.
   * @param selected - Whether the vertex is selected
   * @param width - The width of the vertex background
   * @param height - The height of the vertex background
   * @param alpha - The opacity of the vertex background
   */
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
      if (this.sprite !== null) {
        this.removeChild(this.sprite);
      }
      this.sprite = VtxBackgroundWrapper.drawSprite(
        this.stageInterface,
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
