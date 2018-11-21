import { DragRegistry } from "./dragAndSelection/dragRegistry.js";

export class PortWrapper {
  private static borderWidth = 2;

  private static cachedPortTexture: PIXI.RenderTexture | null = null;
  private static createSprite(renderer: PIXI.WebGLRenderer | PIXI.CanvasRenderer): PIXI.Sprite {
    if (PortWrapper.cachedPortTexture !== null) {
      const sprite = new PIXI.Sprite(PortWrapper.cachedPortTexture);
      sprite.cacheAsBitmap = true;
      return sprite;
    }

    const graphics = new PIXI.Graphics();

    graphics.lineColor = 0x000000;
    graphics.lineWidth =PortWrapper.borderWidth;
    graphics.beginFill(0x999999);
    graphics.drawRoundedRect(
      0 + PortWrapper.borderWidth/2,
      0 + PortWrapper.borderWidth/2,
      20 + PortWrapper.borderWidth/2,
      12 + PortWrapper.borderWidth/2,
      5,
    );

    const texture = renderer.generateTexture(
      graphics,
      undefined, // scale mode
      renderer.resolution*4, // resolution
      undefined, // region
    );

    PortWrapper.cachedPortTexture = texture;

    const sprite = new PIXI.Sprite(texture);
    sprite.cacheAsBitmap = true;
    return sprite;
  }

  private isOutput: boolean;
  private sprite: PIXI.Sprite;

  private positionChangedListeners: Array<() => void> = [];

  constructor(renderer: PIXI.WebGLRenderer | PIXI.CanvasRenderer, isOutput: boolean) {
    this.isOutput = isOutput;

    this.sprite = PortWrapper.createSprite(renderer);

    this.sprite.interactive = true;
    this.sprite.buttonMode = true;
  }

  public getDisplayObject() {
    return this.sprite;
  }

  public getIsOutput(): boolean {
    return this.isOutput;
  }

  public addPositionChangedListener(listener: () => void): void {
    this.positionChangedListeners.push(listener);;
  }
  public setPosition(x: number, y: number): void {
    if (this.sprite.position.x !== x || this.sprite.position.y !== y) {
      this.sprite.position.set(x, y);
      for (const listener of this.positionChangedListeners) {
        listener();
      }
    }
  }

  public getWidth(): number {
    return this.sprite.width;
  }

  public getHeight(): number {
    return this.sprite.height;
  }

  public localX(): number {
    return this.sprite.position.x;
  }

  public localY(): number {
    return this.sprite.position.y;
  }

  public addTo(obj: PIXI.Container): void {
    obj.addChild(this.sprite);
  }

  public removeFrom(obj: PIXI.Container): void {
    obj.removeChild(this.sprite);
  }
}
