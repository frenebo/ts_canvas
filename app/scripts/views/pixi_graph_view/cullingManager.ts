import { VertexWrapper } from "./vertexWrapper";
import { EdgeWrapper } from "./edgeWrapper";
import { BackgroundWrapper } from "./backgroundWrapper";

export class CullingManager {
  private vertexWrappers: {[key: string]: VertexWrapper} = {};
  private edgeWrappers: {[key: string]: EdgeWrapper} = {};

  constructor(
    private readonly backgroundWrapper: BackgroundWrapper,
    private readonly renderer: PIXI.WebGLRenderer | PIXI.CanvasRenderer,
  ) {
    const that = this;
    backgroundWrapper.onPositionOrZoomChanged(() => {
      that.onPositionOrZoomChanged();
    });
  }

  public registerVertex(vertexKey: string, vertex: VertexWrapper): void {
    this.vertexWrappers[vertexKey] = vertex;
  }

  public registerEdge(edgeKey: string, edge: EdgeWrapper): void {
    this.edgeWrappers[edgeKey] = edge;
  }

  public removeVertex(vertexKey: string, vertex: VertexWrapper): void {
    delete this.vertexWrappers[vertexKey];
  }

  public removeEdge(edgeKey: string, edge: EdgeWrapper): void {
    delete this.edgeWrappers[edgeKey];
  }

  private onPositionOrZoomChanged(): void {
    const backgroundLeftX = - this.backgroundWrapper.localX()/this.backgroundWrapper.getScale();
    const backgroundTopY = - this.backgroundWrapper.localY()/this.backgroundWrapper.getScale();
    const backgroundRightX = this.renderer.width/this.backgroundWrapper.getScale() + backgroundLeftX;
    const backgroundBottomY = this.renderer.height/this.backgroundWrapper.getScale() + backgroundTopY;

    for (const vertexId in this.vertexWrappers) {
      const vertexWrapper = this.vertexWrappers[vertexId];
      if (
        vertexWrapper.localX() + vertexWrapper.localBounds().x > backgroundRightX ||
        vertexWrapper.localX() + vertexWrapper.localBounds().x + vertexWrapper.localBounds().width < backgroundLeftX ||
        vertexWrapper.localY() + vertexWrapper.localBounds().y > backgroundBottomY ||
        vertexWrapper.localY() + vertexWrapper.localBounds().y + vertexWrapper.localBounds().height < backgroundTopY
      ) {
        vertexWrapper.setVisible(false);
      } else {
        vertexWrapper.setVisible(true);
      }
    }

    for (const edgeId in this.edgeWrappers) {
      const edgeWrapper = this.edgeWrappers[edgeId];
      if (
        edgeWrapper.localX() + edgeWrapper.localBounds().x > backgroundRightX ||
        edgeWrapper.localX() + edgeWrapper.localBounds().x + edgeWrapper.localBounds().width < backgroundLeftX ||
        edgeWrapper.localY() + edgeWrapper.localBounds().y > backgroundBottomY ||
        edgeWrapper.localY() + edgeWrapper.localBounds().y + edgeWrapper.localBounds().height < backgroundTopY
      ) {
        edgeWrapper.setVisible(false);
      } else {
        edgeWrapper.setVisible(true);
      }
    }
    // console.log(
    //   backgroundTopLeftX,
    //   backgroundTopLeftY,
    //   backgroundBottomRightX,
    //   backgroundBottomRightY,
    // );
  }
}
