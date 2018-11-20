import { DragRegistry } from "./dragRegistry";

export class PortWrapper {
  private static borderWidth = 2;
  private static createSprite(renderer: PIXI.WebGLRenderer | PIXI.CanvasRenderer): PIXI.Sprite {
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

    return new PIXI.Sprite(renderer.generateTexture(
      graphics,
      undefined, // scale mode
      renderer.resolution*4, // resolution
      undefined, // region
    ));
  }

  private isDragging: boolean = false;
  private dragRegistry: DragRegistry;
  private sprite: PIXI.Sprite;
  private dragStartListeners: Array<(x: number, y: number) => void> = [];
  private dragMoveListeners: Array<(x: number, y: number) => void> = [];
  private dragEndListeners: Array<(x: number, y: number) => void> = [];

  constructor(dragRegistry: DragRegistry, renderer: PIXI.WebGLRenderer | PIXI.CanvasRenderer) {
    this.dragRegistry = dragRegistry;

    this.sprite = PortWrapper.createSprite(renderer);

    this.sprite.interactive = true;
    this.sprite.buttonMode = true;

    const that = this;
    this.sprite
      .on('mousedown',       (event: PIXI.interaction.InteractionEvent) => that.onDragStart(event))
      .on('touchstart',      (event: PIXI.interaction.InteractionEvent) => that.onDragStart(event))
      .on('mouseup',         (event: PIXI.interaction.InteractionEvent) => that.onDragEnd(event))
      .on('mouseupoutside',  (event: PIXI.interaction.InteractionEvent) => that.onDragEnd(event))
      .on('touchend',        (event: PIXI.interaction.InteractionEvent) => that.onDragEnd(event))
      .on('touchendoutside', (event: PIXI.interaction.InteractionEvent) => that.onDragEnd(event))
      .on('mousemove',       (event: PIXI.interaction.InteractionEvent) => that.onDragMove(event))
      .on('touchmove',       (event: PIXI.interaction.InteractionEvent) => that.onDragMove(event));
  }

  public addDragStartListener(listener: (x: number, y: number) => void): void {
    this.dragStartListeners.push(listener);
  }
  public addDragMoveListener(listener: (x: number, y: number) => void): void {
    this.dragMoveListeners.push(listener);
  }
  public addDragEndListener(listener: (x: number, y: number) => void): void {
    this.dragEndListeners.push(listener);
  }

  public setPosition(x: number, y: number): void {
    if (this.sprite.position.x === x && this.sprite.position.y === y) return;
    this.sprite.position.set(x, y);
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

  private onDragStart(ev: PIXI.interaction.InteractionEvent): void {
    if (this.dragRegistry.isLocked()) return;

    this.dragRegistry.lock();
    this.isDragging = true;
    for (const listener of this.dragStartListeners) {
      listener(ev.data.global.x, ev.data.global.y); // Center of the port
    }
  }
  private onDragMove(ev: PIXI.interaction.InteractionEvent): void {
    if (this.isDragging) {
      for (const listener of this.dragMoveListeners) {
        listener(ev.data.global.x, ev.data.global.y);
      }
    }
  }
  private onDragEnd(ev: PIXI.interaction.InteractionEvent): void {
    if (this.isDragging) {
      this.dragRegistry.unlock();
      this.isDragging = false;
      for (const listener of this.dragEndListeners) {
        listener(ev.data.global.x, ev.data.global.y);
      }
    }
  }
}
