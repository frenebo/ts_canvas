import { BackgroundWrapper } from "./graphicWrappers/backgroundWrapper.js";
import { EdgeWrapper } from "./graphicWrappers/edgeWrapper.js";
import { VertexWrapper } from "./graphicWrappers/vertexWrapper.js";
import { StageInterface } from "./stageInterface.js";

export class StageManager {
  private readonly app: PIXI.Application;
  private readonly childContainer: PIXI.Container;
  private readonly overlayContainer: PIXI.Container;
  private readonly backgroundWrapper: BackgroundWrapper;
  private readonly positionZoomChangedListeners: Array<() => void> = [];
  private readonly stageInterface: StageInterface;

  constructor(div: HTMLDivElement) {
    this.app = new PIXI.Application();
    div.appendChild(this.app.view);

    this.app.ticker.start(); // to keep refreshing screen

    this.backgroundWrapper = new BackgroundWrapper(this.app.renderer);
    this.app.stage.addChild(this.backgroundWrapper.getDisplayObject());
    this.childContainer = new PIXI.Container();
    this.app.stage.addChild(this.childContainer);
    this.overlayContainer = new PIXI.Container();
    this.app.stage.addChild(this.overlayContainer);

    this.app.view.addEventListener("wheel", (ev) => {
      const mouseXInStageFrame = this.getMousePos().x;
      const mouseYInStageFrame = this.getMousePos().y;

      const scrollFactor = Math.pow(1.003, -ev.deltaY);
      this.setScale(this.getScale() * scrollFactor);

      const moveStageX = (this.getMousePos().x - mouseXInStageFrame) * this.getScale();
      const moveStageY = (this.getMousePos().y - mouseYInStageFrame) * this.getScale();

      this.setPosition(
        this.stageXOffset() + moveStageX,
        this.stageYOffset() + moveStageY,
      );
    });

    this.stageInterface = new StageInterface(
      this.app.renderer,
      () => this.getScale(),
      (l) => { this.onPositionOrZoomChanged(l); },
      () => this.getMousePos(),
      (obj) => { this.addOverlayChild(obj); },
      (obj) => { this.removeOverlayChild(obj); },
      () => this.stageXOffset(),
      () => this.stageYOffset(),
      () => this.backgroundWrapper.getDisplayObject(),
      (data) => this.getDataRelativeLoc(data),
      (dx, dy) => { this.setStagePosAbsolute(dx, dy); },
      () => this.app.renderer.width,
      () => this.app.renderer.height,
    );
  }

  private setStagePosAbsolute(x: number, y: number): void {
    this.setPosition(x, y);
  }

  private getDataRelativeLoc(data: PIXI.interaction.InteractionData): PIXI.Point {
    return data.getLocalPosition(this.childContainer);
  }

  public removeEdge(edge: EdgeWrapper): void {
    edge.removeFrom(this.childContainer);
  }

  public removeVertex(vertex: VertexWrapper): void {
    vertex.removeFrom(this.childContainer);
  }

  public addVertex(vertex: VertexWrapper): void {
    vertex.addTo(this.childContainer);
  }

  public addEdge(edge: EdgeWrapper): void {
    edge.addTo(this.childContainer);
  }

  private addOverlayChild(obj: PIXI.DisplayObject): void {
    this.overlayContainer.addChild(obj);
  }

  private removeOverlayChild(obj: PIXI.DisplayObject): void {
    this.overlayContainer.removeChild(obj);
  }

  public setDimensions(width: number, height: number): void {
    this.backgroundWrapper.setDimensions(width, height);
    this.app.renderer.resize(width, height);
  }

  private setScale(scale: number): void {
    this.childContainer.scale.set(scale);
    this.backgroundWrapper.setScale(scale);
    this.overlayContainer.scale.set(scale);

    for (const listener of this.positionZoomChangedListeners) {
      listener();
    }
  }

  private setPosition(x: number, y: number): void {
    this.childContainer.position.set(x, y);
    this.backgroundWrapper.setPosition(x, y);
    this.overlayContainer.position.set(x, y);

    for (const listener of this.positionZoomChangedListeners) {
      listener();
    }
  }

  private getScale(): number {
    return this.childContainer.scale.x;
  }

  private stageXOffset(): number {
    return this.childContainer.position.x;
  }

  private stageYOffset(): number {
    return this.childContainer.position.y;
  }

  public getMousePos(): {x: number; y: number} {
    const mouseX: number =
      this.app.renderer.plugins.interaction.mouse.global.x / this.getScale() - this.stageXOffset() / this.getScale();

    const mouseY: number =
      this.app.renderer.plugins.interaction.mouse.global.y / this.getScale() - this.stageYOffset() / this.getScale();

    return {
      x: mouseX,
      y: mouseY,
    };
  }

  public onPositionOrZoomChanged(l: () => void): void {
    this.positionZoomChangedListeners.push(l);
  }

  public getStageInterface(): StageInterface {
    return this.stageInterface;
  }
}
