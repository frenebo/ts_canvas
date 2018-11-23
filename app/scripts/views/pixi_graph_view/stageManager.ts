import { VertexWrapper } from "./vertexWrapper.js";
import { BackgroundWrapper } from "./backgroundWrapper.js";
import { EdgeWrapper } from "./edgeWrapper.js";

export class StageManager {
  private readonly app: PIXI.Application;
  private readonly background: BackgroundWrapper;

  constructor(div: HTMLDivElement) {
    this.app = new PIXI.Application(800, 600);
    div.appendChild(this.app.view);

    this.app.ticker.start(); // To continually refresh view

    this.background = new BackgroundWrapper(this.app.renderer);
    this.app.stage.addChild(this.background.getDisplayObject());
  }

  public getBackgroundWrapper() {
    return this.background;
  }

  public getRenderer() {
    return this.app.renderer;
  }

  public addVertex(vertexWrapper: VertexWrapper): void {
    this.background.addVertex(vertexWrapper);
  }

  public removeVertex(vertexWrapper: VertexWrapper): void {
    this.background.removeVertex(vertexWrapper);
  }

  public addEdge(edgeWrapper: EdgeWrapper): void {
    this.background.addEdge(edgeWrapper);
  }

  public removeEdge(edgeWrapper: EdgeWrapper): void {
    this.background.removeEdge(edgeWrapper);
  }
}
