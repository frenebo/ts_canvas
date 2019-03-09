import { StageInterface } from "../stageInterface.js";
import { GraphicWrapper } from "./graphicWrapper.js";

/** Class for wrapping the PIXI graphic for a vertex's port */
export class PortWrapper extends GraphicWrapper {
  public static width = 20;
  public static height = 12;
  private static readonly texturePadding = 4;
  private static readonly borderWidth = 2;

  private static cachedPortTexture: PIXI.RenderTexture | null = null;
  
  /**
   * Creates a port sprite.
   * @param stageInterface - The stage interface
   * @returns The created port sprite
   */
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

  /**
   * Constructs a port wrapper.
   * @param stageInterface - The stage interface
   * @param isOutput - Whether the port is an output port
   */
  constructor(
    stageInterface: StageInterface,
    isOutput: boolean,
  ) {
    super(true);

    this.isOutput = isOutput;

    this.sprite = PortWrapper.createSprite(stageInterface);
    this.addChild(this.sprite);
    this.sprite.position.set(-PortWrapper.texturePadding);
  }

  /**
   * Gives whether the port is an output port
   * @returns Whether the port is an output port: true means output, false means input
   */
  public getIsOutput(): boolean {
    return this.isOutput;
  }
}
