import { EdgeWrapper } from "../graphicWrappers/edgeWrapper.js";
import { VertexWrapper } from "../graphicWrappers/vertexWrapper.js";
import { StageInterface } from "../stageInterface.js";
import { PositionTracker } from "./positionTracker.js";

export class CullingManager {
  private readonly vertexWrappers: {[key: string]: VertexWrapper} = {};
  private readonly edgeWrappers: {[key: string]: EdgeWrapper} = {};
  private readonly posTracker: PositionTracker;

  constructor(
    private readonly stageInterface: StageInterface,
  ) {
    this.posTracker = new PositionTracker();

    stageInterface.onPositionOrZoomChanged(() => {
      this.positionOrZoomChanged();
    });
  }

  public registerVertex(vertexKey: string, vertex: VertexWrapper): void {
    this.vertexWrappers[vertexKey] = vertex;
    this.posTracker.addObject(
      vertexKey,
      vertex.localX() + vertex.localBounds().x,
      vertex.localX() + vertex.localBounds().x + vertex.localBounds().width,
      vertex.localY() + vertex.localBounds().y,
      vertex.localY() + vertex.localBounds().y + vertex.localBounds().height,
    );
  }

  public updateVertex(vertexKey: string): void {
    const vertex = this.vertexWrappers[vertexKey];

    const vtxLeft = vertex.localX() + vertex.localBounds().x;
    const vtxRight = vertex.localX() + vertex.localBounds().x + vertex.localBounds().width;
    const vtxTop = vertex.localY() + vertex.localBounds().y;
    const vtxBottom = vertex.localY() + vertex.localBounds().y + vertex.localBounds().height;
    this.posTracker.updateObject(
      vertexKey,
      vtxLeft,
      vtxRight,
      vtxTop,
      vtxBottom,
    );

    vertex.setVisible(this.posTracker.doesObjectOverlayBox(
      vertexKey,
      vtxLeft,
      vtxRight,
      vtxTop,
      vtxBottom,
    ));
  }

  public registerEdge(edgeKey: string, edge: EdgeWrapper): void {
    this.edgeWrappers[edgeKey] = edge;
  }

  public removeVertex(vertexKey: string): void {
    delete this.vertexWrappers[vertexKey];
    this.posTracker.removeObject(vertexKey);
  }

  public removeEdge(edgeKey: string, edge: EdgeWrapper): void {
    delete this.edgeWrappers[edgeKey];
  }

  private positionOrZoomChanged(): void {
    const backgroundLeftX = - this.stageInterface.getStageX() / this.stageInterface.getScale();
    const backgroundTopY = - this.stageInterface.getStageY() / this.stageInterface.getScale();
    const backgroundRightX = this.stageInterface.getRendererWidth() / this.stageInterface.getScale() + backgroundLeftX;
    const backgroundBottomY = this.stageInterface.getRendererHeight() / this.stageInterface.getScale() + backgroundTopY;

    const verticesInBox = this.posTracker.filterVerticesInBox(
      backgroundLeftX,
      backgroundRightX,
      backgroundTopY,
      backgroundBottomY,
    );

    for (const vertexId in this.vertexWrappers) {
      if (verticesInBox.has(vertexId)) {
        // console.log("visible");
        this.vertexWrappers[vertexId].setVisible(true);
      } else {
        // console.log("invisible");
        this.vertexWrappers[vertexId].setVisible(false);
      }
    }
  }
}
