
export abstract class GraphicWrapper {
  private readonly container: PIXI.Container;
  private readonly positionChangedListeners: Array<() => void> = [];

  constructor(config: {
    buttonMode?: boolean;
    hitArea?: PIXI.Rectangle | PIXI.Circle | PIXI.Ellipse | PIXI.Polygon | PIXI.RoundedRectangle | PIXI.HitArea;
  }) {
    this.container = new PIXI.Container();
    this.container.interactive = true;
    this.container.buttonMode = config.buttonMode === undefined ? false : config.buttonMode;
    if (config.hitArea !== undefined) {
      this.container.hitArea = config.hitArea;
    }
  }

  public getDataRelativeLoc(data: PIXI.interaction.InteractionData) {
    return data.getLocalPosition(this.container);
  }

  public localBounds(): PIXI.Rectangle {
    return this.container.getLocalBounds();
  }

  public setVisible(visible: boolean): void {
    this.container.visible = visible;
  }

  public localX(): number {
    return this.container.position.x;
  }

  public localY(): number {
    return this.container.position.y;
  }

  public setPosition(x: number, y: number): void {
    this.container.position.set(x, y);

    for (const listener of this.positionChangedListeners) {
      listener();
    }
  }

  public addPositionChangedListener(listener: () => void): void {
    this.positionChangedListeners.push(listener);
  }

  public getDisplayObject(): PIXI.Container {
    return this.container;
  }

  public addTo(obj: PIXI.Container): void {
    obj.addChild(this.container);
  }

  public removeFrom(obj: PIXI.Container): void {
    obj.removeChild(this.container);
  }

  public addChild(obj: PIXI.DisplayObject | GraphicWrapper): void {
    this.container.addChild(obj instanceof GraphicWrapper ? obj.container : obj);
  }

  public addChildAt(obj: PIXI.DisplayObject | GraphicWrapper, position: number): void {
    this.container.addChildAt(obj instanceof GraphicWrapper ? obj.container : obj, position);
  }

  public removeChild(obj: PIXI.DisplayObject | GraphicWrapper): void {
    this.container.removeChild(obj instanceof GraphicWrapper ? obj.container : obj);
  }

  protected updateHitArea(
    hitArea: PIXI.Rectangle | PIXI.Circle | PIXI.Ellipse | PIXI.Polygon | PIXI.RoundedRectangle | PIXI.HitArea,
  ): void {
    this.container.hitArea = hitArea;
  }
}
