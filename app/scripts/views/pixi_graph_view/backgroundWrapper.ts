import { BACKGROUND_TILE_PATH } from "../../constants.js";
import { VertexWrapper } from "./vertexWrapper.js";
import { EdgeWrapper } from "./edgeWrapper.js";

export class BackgroundWrapper {
  private readonly sprite: PIXI.extras.TilingSprite;
  private readonly childContainer: PIXI.Container;
  private readonly positionOrZoomChangeListeners: Array<() => void> = [];
  private scale: number = 1;

  constructor(
    renderer: PIXI.WebGLRenderer | PIXI.CanvasRenderer,
  ) {
    const texture = PIXI.Texture.fromImage(BACKGROUND_TILE_PATH);
    this.sprite = new PIXI.extras.TilingSprite(texture, renderer.width, renderer.height);
    this.childContainer = new PIXI.Container();
    this.sprite.addChild(this.childContainer);

    this.sprite.interactive = true;

    const that = this;
    renderer.view.addEventListener("wheel", (ev) => {
      ev.preventDefault();

      const scrollFactor = Math.pow(1.003, -ev.deltaY);
      const mouseGlobalPos: PIXI.Point = renderer.plugins.interaction.mouse.global;
      const mouseAbsoluteX = mouseGlobalPos.x - that.childContainer.position.x;
      const mouseAbsoluteY = mouseGlobalPos.y - that.childContainer.position.y;

      that.setScale(scrollFactor);

      that.setPosition(
        mouseGlobalPos.x - mouseAbsoluteX*scrollFactor,
        mouseGlobalPos.y - mouseAbsoluteY*scrollFactor,
      );
    });
  }

  public getDisplayObject() {
    return this.sprite;
  }

  public addTo(obj: PIXI.Container): void {
    obj.addChild(this.sprite);
  }

  public addChild(obj: PIXI.DisplayObject): void {
    this.childContainer.addChild(obj);
  }

  public removeChild(obj: PIXI.DisplayObject): void {
    this.childContainer.removeChild(obj);
  }

  public addVertex(vtxWrapper: VertexWrapper): void {
    vtxWrapper.addTo(this.childContainer);
  }

  public removeVertex(vtxWrapper: VertexWrapper): void {
    vtxWrapper.removeFrom(this.childContainer);
  }

  public addEdge(edgeWrapper: EdgeWrapper): void {
    edgeWrapper.addTo(this.childContainer);
  }

  public removeEdge(edgeWrapper: EdgeWrapper): void {
    edgeWrapper.removeFrom(this.childContainer);
  }

  public getDataRelativeLoc(data: PIXI.interaction.InteractionData) {
    return data.getLocalPosition(this.childContainer);
  }

  public localScale(): number {
    return this.sprite.tileScale.x;
  }

  public localX(): number {
    return this.sprite.tilePosition.x;
  }

  public localY(): number {
    return this.sprite.tilePosition.y;
  }

  public onPositionOrZoomChanged(listener: () => void) {
    this.positionOrZoomChangeListeners.push(listener);
  }

  public setPosition(x: number, y: number): void {
    this.sprite.tilePosition.set(x, y);
    this.childContainer.position.set(x, y);

    for (const listener of this.positionOrZoomChangeListeners) {
      listener();
    }
  }

  public getScale(): number {
    return this.scale;
  }

  private setScale(factor: number): void {
    this.scale = this.sprite.tileScale.x*factor;
    this.sprite.tileScale.set(this.scale);
    this.childContainer.scale.set(this.scale);

    for (const listener of this.positionOrZoomChangeListeners) {
      listener();
    }
  }
}
