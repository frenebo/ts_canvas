import { VertexWrapper } from "./graphicWrappers/vertexWrapper.js";
import { BackgroundWrapper } from "./backgroundWrapper.js";
import { EdgeWrapper } from "./graphicWrappers/edgeWrapper.js";

export class StageManager {
  private readonly app: PIXI.Application;
  private readonly background: BackgroundWrapper;

  constructor(div: HTMLDivElement) {
    this.app = new PIXI.Application();
    div.appendChild(this.app.view);

    this.app.ticker.start(); // To continually refresh view

    this.background = new BackgroundWrapper(this.app.renderer);
    this.app.stage.addChild(this.background.getDisplayObject());
  }

  public setDimensions(width: number, height: number): void {
    this.background.setDimensions(width, height);
    this.app.renderer.resize(width, height);
  }

  public getBackgroundWrapper() {
    return this.background;
  }

  public getRenderer() {
    return this.app.renderer;
  }

  public addVertex(vertexWrapper: VertexWrapper): void {
    this.background.addChild(vertexWrapper);
  }

  public removeVertex(vertexWrapper: VertexWrapper): void {
    this.background.removeChild(vertexWrapper);
  }

  public addEdge(edgeWrapper: EdgeWrapper): void {
    this.background.addChild(edgeWrapper);
  }

  public removeEdge(edgeWrapper: EdgeWrapper): void {
    this.background.removeChild(edgeWrapper);
  }
}
