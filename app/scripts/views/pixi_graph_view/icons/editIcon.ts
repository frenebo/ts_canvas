
export class EditIcon {
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
    if (clicking && EditIcon.cachedClicking !== null) {
      const spriteFromCachedTexture = new PIXI.Sprite(EditIcon.cachedClicking);
      spriteFromCachedTexture.cacheAsBitmap = true;
      return spriteFromCachedTexture;
    }
    if (!clicking && EditIcon.cachedNotClicking !== null) {
      const spriteFromCachedTexture = new PIXI.Sprite(EditIcon.cachedNotClicking);
      spriteFromCachedTexture.cacheAsBitmap = true;
      return spriteFromCachedTexture;
    }

    const graphics = new PIXI.Graphics();
    graphics.beginFill(clicking ? 0x888888 : 0x555555);
    graphics.lineColor = 0x000000;
    graphics.lineWidth = 5;

    function graphPoints(origPts: number[][], loop=false) {
      graphics.moveTo(
        origPts[0][0] + EditIcon.texturePadding,
        origPts[0][1] + EditIcon.texturePadding,
      );

      // if it's a loop, go over the first leg of the polygon again
      const pts = loop ? origPts.concat(origPts.slice(origPts.length - 2)) : origPts;

      for (const pt of pts.slice(1)) {
        graphics.lineTo(
          pt[0] + EditIcon.texturePadding,
          pt[1] + EditIcon.texturePadding,
        );
      }
    }

    graphPoints(EditIcon.outlinePoints, true);
    graphPoints(EditIcon.eraserPoints);

    const texture = renderer.generateTexture(
      graphics,
      undefined,
      renderer.resolution*2,
      new PIXI.Rectangle(
        0,
        0,
        graphics.width + EditIcon.texturePadding*2,
        graphics.height + EditIcon.texturePadding*2,
      ),
    );

    if (clicking) EditIcon.cachedClicking = texture;
    else EditIcon.cachedNotClicking = texture;

    const sprite = new PIXI.Sprite(texture);
    sprite.cacheAsBitmap = true;
    return sprite;
  }

  private static getHitArea(): PIXI.Polygon {
    const outlineFirstPoint = EditIcon.outlinePoints[EditIcon.outlinePoints.length - 1];
    const outlinePoints = EditIcon.outlinePoints.concat([outlineFirstPoint]);
    const points = outlinePoints.map(([x, y]) => {
      return new PIXI.Point(x + EditIcon.texturePadding, y + EditIcon.texturePadding);
    });

    return new PIXI.Polygon(...points);
  }

  private readonly container: PIXI.Container;
  private readonly width: number;
  private readonly height: number;
  private readonly clickListeners: Array<() => void> = [];
  private sprite: PIXI.Sprite;

  constructor(
    private readonly renderer: PIXI.WebGLRenderer | PIXI.CanvasRenderer,
  ) {
    this.container = new PIXI.Container();

    this.container.interactive = true;
    this.container.buttonMode = true;

    this.sprite = EditIcon.draw(false, renderer);
    this.container.addChild(this.sprite);

    this.container.hitArea = EditIcon.getHitArea();

    this.width = this.container.width;
    this.height = this.container.height;
  }

  private isSelected = false;
  public toggleSelected(selected: boolean) {
    if (selected !== this.isSelected) {
      this.container.removeChild(this.sprite);
      this.sprite = EditIcon.draw(selected, this.renderer);
      this.container.addChild(this.sprite);
    }
    this.isSelected = selected;
  }

  public getDisplayObject() {
    return this.container;
  }

  public addClickListener(listener: () => void): void {
    this.clickListeners.push(listener);
  }

  public addTo(obj: PIXI.Container): void {
    obj.addChild(this.container);
  }

  public setPosition(x: number, y: number): void {
    this.container.position.set(x, y);
  }

  public getWidth(): number {
    return this.width;
  }

  public getHeight(): number {
    return this.height;
  }
}
