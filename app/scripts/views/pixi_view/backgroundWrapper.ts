import { BACKGROUND_TILE_PATH } from "../../constants.js";
import { VertexWrapper } from "./vertexWrapper.js";
import { BackgroundDragHandler } from "./backgroundDragHandler.js";
import { DragRegistry } from "./dragRegistry.js";

export class BackgroundWrapper {
  public sprite: PIXI.extras.TilingSprite;
  private childContainer: PIXI.Container;

  constructor(
    dragRegistry: DragRegistry,
    container: HTMLDivElement,
    renderer: PIXI.WebGLRenderer | PIXI.CanvasRenderer,
  ) {
    var texture = PIXI.Texture.fromImage(BACKGROUND_TILE_PATH);
    this.sprite = new PIXI.extras.TilingSprite(texture, renderer.width, renderer.height);
    this.childContainer = new PIXI.Container;
    this.sprite.addChild(this.childContainer);

    this.sprite.interactive = true;
    new BackgroundDragHandler(this, dragRegistry);

    const that = this;
    container.addEventListener("wheel", (ev) => {
      // console.log(ev.deltaY);
      const scrollFactor = Math.pow(1.003, -ev.deltaY);
      const mouseGlobalPos: PIXI.Point = renderer.plugins.interaction.mouse.global;
      const mouseAbsoluteX = mouseGlobalPos.x - that.childContainer.position.x;
      const mouseAbsoluteY = mouseGlobalPos.y - that.childContainer.position.y;

      that.zoom(scrollFactor);

      that.setPosition(
        mouseGlobalPos.x - mouseAbsoluteX*scrollFactor,
        mouseGlobalPos.y - mouseAbsoluteY*scrollFactor,
      );
    });
  }

  public addTo(obj: PIXI.Container): void {
    obj.addChild(this.sprite);
  }

  public addChild(obj: PIXI.DisplayObject): void {
    this.childContainer.addChild(obj);
  }

  // @TODO make more general interface for adding/removing children
  public addVertex(vtxWrapper: VertexWrapper): void {
    vtxWrapper.addTo(this.childContainer);
  }

  public removeVertex(vtxWrapper: VertexWrapper): void {
    vtxWrapper.removeFrom(this.childContainer);
  }

  public on(ev: string, fn: Function, context?: any): this {
    this.sprite.on(ev, fn, context);
    return this;
  }

  public getX(): number {
    return this.sprite.tilePosition.x;
  }

  public getY(): number {
    return this.sprite.tilePosition.y;
  }

  public setPosition(x: number, y: number): void {
    this.sprite.tilePosition.set(x, y);
    this.childContainer.position.set(x, y);
  }

  private zoom(factor: number): void {
    const previousScale = this.sprite.tileScale.x;
    this.sprite.tileScale.set(previousScale*factor);
    this.childContainer.scale.set(previousScale*factor);
  }
}
