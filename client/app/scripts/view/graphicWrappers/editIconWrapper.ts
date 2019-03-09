import { StageInterface } from "../stageInterface.js";
import { GraphicWrapper } from "./graphicWrapper.js";

/** A class for containing a vertex edit icon's graphic */
export class EditIconWrapper extends GraphicWrapper {
  public static height = 50;
  public static width = 50;

  private static readonly texturePadding = 5;
  private static readonly outlinePoints = [
    [0, 50],
    [0, 35],
    [35, 0],
    [50, 15],
    [15, 50],
  ];
  private static readonly eraserPoints = [
    [25, 10],
    [40, 25],
  ];

  private static cachedClicking: PIXI.RenderTexture | null = null;
  private static cachedNotClicking: PIXI.RenderTexture | null = null;

  /**
   * Creates a sprite for an edit icon with the given properties.
   * @param clicking - Whether or not the edit icon is currently being clicked
   * @param stageInterface - The stage interface
   * @returns The generated PIXI sprite
   */
  private static draw(clicking: boolean, stageInterface: StageInterface): PIXI.Sprite {
    if (clicking && EditIconWrapper.cachedClicking !== null) {
      const spriteFromCachedTexture = new PIXI.Sprite(EditIconWrapper.cachedClicking);
      return spriteFromCachedTexture;
    }
    if (!clicking && EditIconWrapper.cachedNotClicking !== null) {
      const spriteFromCachedTexture = new PIXI.Sprite(EditIconWrapper.cachedNotClicking);
      return spriteFromCachedTexture;
    }

    const graphics = new PIXI.Graphics();
    graphics.beginFill(clicking ? 0x888888 : 0x555555);
    graphics.lineColor = 0x000000;
    graphics.lineStyle(5);

    function graphPoints(origPts: number[][], loop = false) {
      graphics.moveTo(
        origPts[0][0] + EditIconWrapper.texturePadding,
        origPts[0][1] + EditIconWrapper.texturePadding,
      );

      // if it's a loop, go over the first leg of the polygon again
      const pts = loop ? origPts.concat(origPts.slice(0, 2)) : origPts;

      for (const pt of pts.slice(1)) {
        graphics.lineTo(
          pt[0] + EditIconWrapper.texturePadding,
          pt[1] + EditIconWrapper.texturePadding,
        );
      }
    }

    graphPoints(EditIconWrapper.outlinePoints, true);
    graphPoints(EditIconWrapper.eraserPoints);

    const texture = stageInterface.generateTexture(
      graphics,
      new PIXI.Rectangle(
        0,
        0,
        EditIconWrapper.width + EditIconWrapper.texturePadding * 2,
        EditIconWrapper.height + EditIconWrapper.texturePadding * 2,
      ),
    );

    if (clicking) {
      EditIconWrapper.cachedClicking = texture;
    } else {
      EditIconWrapper.cachedNotClicking = texture;
    }

    const sprite = new PIXI.Sprite(texture);
    return sprite;
  }

  /**
   * Creates a hit area for a the edit icon.
   * @returns The hit area polygon
   */
  private static createHitArea(): PIXI.Polygon {
    const outlineFirstPoint = EditIconWrapper.outlinePoints[EditIconWrapper.outlinePoints.length - 1];
    const outlinePoints = EditIconWrapper.outlinePoints.concat([outlineFirstPoint]);
    const pixiPoints = outlinePoints.map(([x, y]) => new PIXI.Point(x, y));

    return new PIXI.Polygon(...pixiPoints);
  }

  private readonly clickListeners: Array<() => void> = [];
  private sprite: PIXI.Sprite;
  private beingClicked = false;

  /**
   * Constructs an edit icon wrapper.
   * @param stageInterface - The stage interface
   */
  constructor(
    private readonly stageInterface: StageInterface,
  ) {
    super(
      true,
      EditIconWrapper.createHitArea(),
    );

    this.sprite = new PIXI.Sprite(); // placeholder
    this.addChild(this.sprite);
    this.redraw();
  }

  /**
   * Sets whether or not the edit icon is being clicked/
   * @param clicked - Whether or not the edit icon is being clicked
   */
  public toggleClicking(clicked: boolean) {
    if (clicked !== this.beingClicked) {
      this.beingClicked = clicked;
      this.redraw();
    }
  }

  /**
   * Adds a listener to be called when the edit icon is clicked.
   * @param listener - The listener
   */
  public addClickListener(listener: () => void): void {
    this.clickListeners.push(listener);
  }

  /**
   * Redraws the sprite.
   */
  private redraw(): void {
    this.removeChild(this.sprite);
    this.sprite = EditIconWrapper.draw(this.beingClicked, this.stageInterface);
    this.sprite.position.set(-EditIconWrapper.texturePadding);
    this.addChild(this.sprite);
  }
}
