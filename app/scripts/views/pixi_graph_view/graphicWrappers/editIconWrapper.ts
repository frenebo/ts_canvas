import { GraphicWrapper } from "./graphicsWrapper.js";

export class EditIconWrapper extends GraphicWrapper {
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

  private static draw(clicking: boolean, renderer: PIXI.WebGLRenderer | PIXI.CanvasRenderer): PIXI.Sprite {
    if (clicking && EditIconWrapper.cachedClicking !== null) {
      const spriteFromCachedTexture = new PIXI.Sprite(EditIconWrapper.cachedClicking);
      spriteFromCachedTexture.cacheAsBitmap = true;
      return spriteFromCachedTexture;
    }
    if (!clicking && EditIconWrapper.cachedNotClicking !== null) {
      const spriteFromCachedTexture = new PIXI.Sprite(EditIconWrapper.cachedNotClicking);
      spriteFromCachedTexture.cacheAsBitmap = true;
      return spriteFromCachedTexture;
    }

    const graphics = new PIXI.Graphics();
    graphics.beginFill(clicking ? 0x888888 : 0x555555);
    graphics.lineColor = 0x000000;
    graphics.lineWidth = 5;

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

    const texture = renderer.generateTexture(
      graphics,
      undefined,
      renderer.resolution*2,
      new PIXI.Rectangle(
        0,
        0,
        graphics.width + EditIconWrapper.texturePadding*2,
        graphics.height + EditIconWrapper.texturePadding*2,
      ),
    );

    if (clicking) EditIconWrapper.cachedClicking = texture;
    else EditIconWrapper.cachedNotClicking = texture;

    const sprite = new PIXI.Sprite(texture);
    sprite.cacheAsBitmap = true;
    return sprite;
  }

  private static getHitArea(): PIXI.Polygon {
    const outlineFirstPoint = EditIconWrapper.outlinePoints[EditIconWrapper.outlinePoints.length - 1];
    const outlinePoints = EditIconWrapper.outlinePoints.concat([outlineFirstPoint]);
    const points = outlinePoints.map(([x, y]) => {
      return new PIXI.Point(x + EditIconWrapper.texturePadding, y + EditIconWrapper.texturePadding);
    });

    return new PIXI.Polygon(...points);
  }

  private readonly width: number;
  private readonly height: number;
  private readonly clickListeners: Array<() => void> = [];
  private sprite: PIXI.Sprite;

  constructor(
    private readonly renderer: PIXI.WebGLRenderer | PIXI.CanvasRenderer,
  ) {
    super({
      buttonMode: true,
      hitArea: EditIconWrapper.getHitArea(),
    });

    this.sprite = EditIconWrapper.draw(false, renderer);
    this.addChild(this.sprite);

    this.width = this.getBackgroundWidth();
    this.height = this.getBackgroundHeight();
  }

  private isSelected = false;
  public toggleSelected(selected: boolean) {
    if (selected !== this.isSelected) {
      this.removeChild(this.sprite);
      this.sprite = EditIconWrapper.draw(selected, this.renderer);
      this.addChild(this.sprite);
    }
    this.isSelected = selected;
  }

  public addClickListener(listener: () => void): void {
    this.clickListeners.push(listener);
  }
}
