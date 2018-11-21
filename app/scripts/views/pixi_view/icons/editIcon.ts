import { DragRegistry } from "../dragAndSelection/dragRegistry";

export class EditIcon {
  private static texturePadding = 5;
  private static outlinePoints = [
    [0, 50],
    [0, 35],
    [35, 0],
    [50, 15],
    [15, 50],
    [0, 50],
    [0, 35],
  ];
  private static eraserPoints = [
    [25, 10],
    [40, 25],
  ];


  private static cachedClicking: PIXI.RenderTexture | null = null;
  private static cachedNotClicking: PIXI.RenderTexture | null = null;

  private static draw(clicking: boolean, renderer: PIXI.WebGLRenderer | PIXI.CanvasRenderer): PIXI.Sprite {
    if (clicking && EditIcon.cachedClicking !== null) return new PIXI.Sprite(EditIcon.cachedClicking);
    if (!clicking && EditIcon.cachedNotClicking !== null) return new PIXI.Sprite(EditIcon.cachedNotClicking);

    const graphics = new PIXI.Graphics();
    graphics.beginFill(clicking ? 0x888888 : 0x555555);
    graphics.lineColor = 0x000000;
    graphics.lineWidth = 5;

    function graphPoints(pts: number[][]) {
      graphics.moveTo(
        pts[0][0] + EditIcon.texturePadding,
        pts[0][1] + EditIcon.texturePadding,
      );

      for (const pt of pts.slice(1)) {
        graphics.lineTo(
          pt[0] + EditIcon.texturePadding,
          pt[1] + EditIcon.texturePadding,
        );
      }
    }

    graphPoints(EditIcon.outlinePoints);
    graphPoints(EditIcon.eraserPoints);

    // graphics.position.set(EditIcon.texturePadding, EditIcon.texturePadding);

    const texture = renderer.generateTexture(
      graphics,
      undefined,
      renderer.resolution*2,
      new PIXI.Rectangle(
        0,
        0,
        graphics.width + EditIcon.texturePadding*2,
        graphics.height + EditIcon.texturePadding*2,
      )
    );

    if (clicking) EditIcon.cachedClicking = texture;
    else EditIcon.cachedNotClicking = texture;

    return new PIXI.Sprite(texture);
  }

  private static getHitArea(): PIXI.Polygon {
    const points = [
      new PIXI.Point(0, 50),
      new PIXI.Point(0, 35),
      new PIXI.Point(35, 0),
      new PIXI.Point(50, 15),
      new PIXI.Point(15, 50),
      new PIXI.Point(0, 50),
    ].map(pt => new PIXI.Point(pt.x + EditIcon.texturePadding, pt.y + EditIcon.texturePadding));

    return new PIXI.Polygon(...points);
  }

  private container: PIXI.Container;
  private sprite: PIXI.Sprite;
  private clickListeners: Array<() => void> = [];

  constructor(
    dragRegistry: DragRegistry,
    renderer: PIXI.WebGLRenderer | PIXI.CanvasRenderer,
  ) {
    this.container = new PIXI.Container();

    this.container.interactive = true;
    this.container.buttonMode = true;

    const clickBegin = () => {
      this.container.removeChild(this.sprite);
      this.sprite = EditIcon.draw(true, renderer);
      this.container.addChild(this.sprite);
    }
    const clickEnd = () => {
      this.container.removeChild(this.sprite);
      this.sprite = EditIcon.draw(false, renderer);
      this.container.addChild(this.sprite);

      for (const clickListener of this.clickListeners) {
        clickListener();
      }
    }

    dragRegistry.registerEditIcon(this, clickBegin, clickEnd);

    this.sprite = EditIcon.draw(false, renderer);
    this.container.addChild(this.sprite);

    this.container.hitArea = EditIcon.getHitArea();
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
    return this.container.width;
  }

  public getHeight(): number {
    return this.container.height;
  }
}
