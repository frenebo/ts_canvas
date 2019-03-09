
// @TODO replace this with something better

/** Class for an interface to the stage */
export class StageInterface {
  /**
   * Constructs a stage interface.
   * @param renderer - The graph's renderer
   * @param getScaleFunc - A function to return the graph's view scale
   * @param onPositionOrZoomChangedFunc - A function to add a listener to be called when the view zoom or position changes
   * @param getMousePosFunc - A function to return the current position of the mouse in the graph
   * @param addDisplayObjectFunc - A function to add a display object to the graph
   * @param removeDisplayObjectFunc - A function to remove a display object from the graph
   * @param getStageXFunc - A function to get the X position of the graph's stage
   * @param getStageYFunc - A function to get the Y position of the graph's stage
   * @param getBackgroundDisplayObjectFunc - The function to get the stage's background
   * @param getDataRelativeLocFunc - A function to get the relative location of a PIXI interaction's data
   * @param setStagePositionAbsoluteFunc - A function to set the absolute stage position
   * @param getRendererWidthFunc - A function to get the renderer width
   * @param getRendererHeightFunc - A function to get the renderer height
   */
  constructor(
    private readonly renderer: PIXI.WebGLRenderer | PIXI.CanvasRenderer,
    private readonly getScaleFunc: () => number,
    private readonly onPositionOrZoomChangedFunc: (l: () => void) => void,
    private readonly getMousePosFunc: () => {x: number; y: number},
    private readonly addDisplayObjectFunc: (obj: PIXI.DisplayObject) => void,
    private readonly removeDisplayObjectFunc: (obj: PIXI.DisplayObject) => void,
    private readonly getStageXFunc: () => number,
    private readonly getStageYFunc: () => number,
    private readonly getBackgroundDisplayObjectFunc: () => PIXI.DisplayObject,
    private readonly getDataRelativeLocFunc: (data: PIXI.interaction.InteractionData) => PIXI.Point,
    private readonly setStagePositionAbsoluteFunc: (dx: number, dy: number) => void,
    private readonly getRendererWidthFunc: () => number,
    private readonly getRendererHeightFunc: () => number,
  ) {
    // empty
  }

  /**
   * Sets the stage absolute position, not adjusted for user zoom
   * @param dx - The new X position
   * @param dy - The new Y position
   */
  public setStagePositionAbsolute(dx: number, dy: number): void {
    this.setStagePositionAbsoluteFunc(dx, dy);
  }

  /**
   * Generates a texture for a display object
   * @param displayObject - The display object
   * @param region - An optional region to generate texture for
   * @returns The generated texture
   */
  public generateTexture(displayObject: PIXI.DisplayObject, region?: PIXI.Rectangle): PIXI.RenderTexture {
    return this.renderer.generateTexture(
      displayObject,
      undefined,
      this.renderer.resolution * 4,
      region,
    );
  }

  /**
   * Gets the width of the renderer.
   * @returns The renderer width
   */
  public getRendererWidth(): number {
    return this.getRendererWidthFunc();
  }

  /**
   * Gets the height of the renderer.
   * @returns The renderer height
   */
  public getRendererHeight(): number {
    return this.getRendererHeightFunc();
  }

  /**
   * Gets the stage's scale.
   * @returns The stage's scale
   */
  public getScale(): number {
    return this.getScaleFunc();
  }

  /**
   * Adds a listener to be called when the user's view position or zoom changes.
   * @param listener - The listener
   */
  public onPositionOrZoomChanged(listener: () => void): void {
    this.onPositionOrZoomChangedFunc(listener);
  }

  /**
   * Gets the X position of the stage.
   * @returns The X position of the stage
   */
  public getStageX(): number {
    return this.getStageXFunc();
  }

  /**
   * Gets the Y position of the stage.
   * @returns The Y position of the stage
   */
  public getStageY(): number {
    return this.getStageYFunc();
  }

  /**
   * Gets the position of the mouse in the graph.
   * @returns An object with the X and Y coordinates of the mouse
   */
  public getMousePos(): {x: number; y: number} {
    return this.getMousePosFunc();
  }

  /**
   * Adds a display object to the stage.
   * @param obj - The display object
   */
  public addDisplayObject(obj: PIXI.DisplayObject): void {
    this.addDisplayObjectFunc(obj);
  }

  /**
   * Removes a display object from the stage.
   * @param obj - The display object
   */
  public removeDisplayObject(obj: PIXI.DisplayObject): void {
    this.removeDisplayObjectFunc(obj);
  }

  /**
   * Gets the display object for the stage background.
   * @returns The background's display object
   */
  public getBackgroundDisplayObject(): PIXI.DisplayObject {
    return this.getBackgroundDisplayObjectFunc();
  }

  /**
   * Gets the position of a PIXI interaction relative to the graph
   * @param data - The PIXI interaction's data
   */
  public getDataRelativeLoc(data: PIXI.interaction.InteractionData) {
    return this.getDataRelativeLocFunc(data);
  }
}
