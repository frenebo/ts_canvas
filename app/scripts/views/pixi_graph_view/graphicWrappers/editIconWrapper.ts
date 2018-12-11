import { GraphicWrapper } from "./graphicWrapper.js";
import { StageInterface } from "../stageInterface.js";

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

    function graphPoints(origPts: number[][], loop=false) {
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
        EditIconWrapper.width + EditIconWrapper.texturePadding*2,
        EditIconWrapper.height + EditIconWrapper.texturePadding*2,
      ),
    );

    if (clicking) EditIconWrapper.cachedClicking = texture;
    else EditIconWrapper.cachedNotClicking = texture;

    const sprite = new PIXI.Sprite(texture);
    return sprite;
  }

  private static getHitArea(): PIXI.Polygon {
    const outlineFirstPoint = EditIconWrapper.outlinePoints[EditIconWrapper.outlinePoints.length - 1];
    const outlinePoints = EditIconWrapper.outlinePoints.concat([outlineFirstPoint]);
    const points = outlinePoints.map(([x, y]) => new PIXI.Point(x, y));

    return new PIXI.Polygon(...points);
  }

  private readonly clickListeners: Array<() => void> = [];
  private sprite: PIXI.Sprite;

  constructor(
    private readonly stageInterface: StageInterface,
  ) {
    super({
      buttonMode: true,
      hitArea: EditIconWrapper.getHitArea(),
    });

    this.sprite = new PIXI.Sprite(); // placeholder
    this.addChild(this.sprite);
    this.redraw();
  }

  private redraw(): void {
    this.removeChild(this.sprite);
    this.sprite = EditIconWrapper.draw(this.isSelected, this.stageInterface);
    this.sprite.position.set(-EditIconWrapper.texturePadding);
    this.addChild(this.sprite);
  }

  private isSelected = false;
  public toggleSelected(selected: boolean) {
    if (selected !== this.isSelected) {
      this.isSelected = selected;
      this.redraw();
    }
  }

  public addClickListener(listener: () => void): void {
    this.clickListeners.push(listener);
  }
}
