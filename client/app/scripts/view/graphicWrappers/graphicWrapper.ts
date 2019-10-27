
/** Class for wrapping a PIXI object */
export abstract class GraphicWrapper {
  private readonly container: PIXI.Container;

  /**
   * Constructs a graphic wrapper.
   * @param buttonMode - Whether the graphic is a button
   * @param hitArea - An optional hit area for the graphic. Must be provided for the graphic to be interactive
   */
  constructor(
    buttonMode = false,
    hitArea?: PIXI.Rectangle | PIXI.Circle | PIXI.Ellipse | PIXI.Polygon | PIXI.RoundedRectangle | PIXI.HitArea,
  ) {
    this.container = new PIXI.Container();
    this.container.interactive = true;
    this.container.buttonMode = buttonMode;
    if (hitArea !== undefined) {
      this.container.hitArea = hitArea;
    }
  }

  /**
   * Returns the position of interaction data relative to this graphic wrapper
   * @param data - The PIXI interaction data
   * @returns The relative point, in the form of a PIXI Point
   */
  public getDataRelativeLoc(data: PIXI.interaction.InteractionData): PIXI.Point {
    return data.getLocalPosition(this.container);
  }

  /**
   * Returns the local bounds of this graphic wrapper.
   * @returns The local bounds of this graphic wrapper
   */
  public localBounds(): PIXI.Rectangle {
    return this.container.getLocalBounds();
  }

  /**
   * Sets whether or not this graphic wrapper is visible.
   * @param visible - Whether or not the graphic will be visible
   */
  public setVisible(visible: boolean): void {
    this.container.visible = visible;
  }

  /**
   * Returns the local X position of this graphic wrapper.
   * @returns The local X position
   */
  public localX(): number {
    return this.container.position.x;
  }

  /**
   * Returns the local Y position of this graphic wrapper.
   * @returns the local Y position
   */
  public localY(): number {
    return this.container.position.y;
  }

  /**
   * Sets the local position of this graphic wrapper.
   * @param x - The new local X
   * @param y - The new local Y
   */
  public setLocalPosition(x: number, y: number): void {
    this.container.position.set(x, y);
  }

  /**
   * Returns the root display object of this graphic wrapper.
   * @returns The root display object
   */
  public getDisplayObject(): PIXI.Container {
    return this.container;
  }

  /**
   * Adds this graphic wrapper's root display object to a PIXI container.
   * @param obj - The PIXI container to add this graphic wrapper's root to
   */
  public addTo(obj: PIXI.Container): void {
    obj.addChild(this.container);
  }

  /**
   * Removes this graphic wrapper's root display object from a PIXI container.
   * @param obj - The PIXI container to remove this graphic wrapper's root from
   */
  public removeFrom(obj: PIXI.Container): void {
    obj.removeChild(this.container);
  }

  /**
   * Adds a PIXI display object or another graphic wrapper's root to this graphic wrapper's root.
   * @param obj - The PIXI display object or graphic wrapper to add
   */
  public addChild(obj: PIXI.DisplayObject | GraphicWrapper): void {
    this.container.addChild(obj instanceof GraphicWrapper ? obj.container : obj);
  }

  /**
   * Adds a PIXI display object or another graphic wrapper's root to this graphic wrapper's root at a certain index.
   * @param obj - The PIXI display object or graphic wrapper to add
   * @param position - The index to add at
   */
  public addChildAt(obj: PIXI.DisplayObject | GraphicWrapper, position: number): void {
    this.container.addChildAt(obj instanceof GraphicWrapper ? obj.container : obj, position);
  }

  /**
   * Removes a PIXI display object or another graphic wrapper's root from this graphic wrapper's root.
   * @param obj - The PIXI display object or graphic wrapper to remove
   */
  public removeChild(obj: PIXI.DisplayObject | GraphicWrapper): void {
    this.container.removeChild(obj instanceof GraphicWrapper ? obj.container : obj);
  }

  /**
   * Updates the hit area of this graphic wrapper's root.
   * @param hitArea - The new hit area
   */
  protected updateHitArea(
    hitArea: PIXI.Rectangle | PIXI.Circle | PIXI.Ellipse | PIXI.Polygon | PIXI.RoundedRectangle | PIXI.HitArea,
  ): void {
    this.container.hitArea = hitArea;
  }
}
