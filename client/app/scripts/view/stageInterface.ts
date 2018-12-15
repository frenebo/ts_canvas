
export class StageInterface {
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

  public setStagePositionAbsolute(dx: number, dy: number): void {
    this.setStagePositionAbsoluteFunc(dx, dy);
  }

  public generateTexture(displayObject: PIXI.DisplayObject, region?: PIXI.Rectangle): PIXI.RenderTexture {
    return this.renderer.generateTexture(
      displayObject,
      undefined,
      this.renderer.resolution * 4,
      region,
    );
  }

  public getRendererWidth(): number {
    return this.getRendererWidthFunc();
  }

  public getRendererHeight(): number {
    return this.getRendererHeightFunc();
  }

  public getScale(): number {
    return this.getScaleFunc();
  }

  public onPositionOrZoomChanged(l: () => void): void {
    this.onPositionOrZoomChangedFunc(l);
  }

  public getStageX(): number {
    return this.getStageXFunc();
  }

  public getStageY(): number {
    return this.getStageYFunc();
  }

  public getMousePos(): {x: number; y: number} {
    return this.getMousePosFunc();
  }

  public addDisplayObject(obj: PIXI.DisplayObject): void {
    this.addDisplayObjectFunc(obj);
  }

  public removeDisplayObject(obj: PIXI.DisplayObject): void {
    this.removeDisplayObjectFunc(obj);
  }

  public getBackgroundDisplayObject(): PIXI.DisplayObject {
    return this.getBackgroundDisplayObjectFunc();
  }

  public getDataRelativeLoc(data: PIXI.interaction.InteractionData) {
    return this.getDataRelativeLocFunc(data);
  }
}
