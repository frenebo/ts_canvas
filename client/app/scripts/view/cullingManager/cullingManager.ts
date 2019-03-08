import { EdgeWrapper } from "../graphicWrappers/edgeWrapper.js";
import { VertexWrapper } from "../graphicWrappers/vertexWrapper.js";
import { StageInterface } from "../stageInterface.js";
import { PositionTracker } from "./positionTracker.js";

/** Class to keep track of graph objects, and "cull" (turn off rendering for) them when they aren't in the area the user sees */
export class CullingManager {
  private readonly vertexWrappers: {[key: string]: VertexWrapper} = {};
  private readonly edgeWrappers: {[key: string]: EdgeWrapper} = {};
  private readonly posTracker: PositionTracker;
  /**
   * Constructs a CullingManager.
   * @param stageInterface - The stage interface the CullingManager will get viewport changes from
   */
  constructor(
    private readonly stageInterface: StageInterface,
  ) {
    this.posTracker = new PositionTracker();

    stageInterface.onPositionOrZoomChanged(() => {
      this.positionOrZoomChanged();
    });
  }

  /**
   * Registers a vertex with the culling manager, so rendering it can be turned off when the user can't see it.
   * @param vertexKey - The key the CullingManager will use to refer to and access the vertex
   * @param vertex - The VertexWrapper that is registered
   */
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

  /**
   * Re-evaluates whether or not a vertex should be rendered.
   * @param vertexKey - the key of the vertex to update
   */
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

  /**
   * Registers an edge with the CullingManager.
   * @param edgeKey - The key the CullingManager will use to refer to and access the edge
   * @param edge - The EdgeWrapper
   */
  public registerEdge(edgeKey: string, edge: EdgeWrapper): void {
    this.edgeWrappers[edgeKey] = edge;
  }

  /**
   * Removes a vertex from the CullingManager.
   * @param vertexKey - The key of the vertex to remove
   */
  public removeVertex(vertexKey: string): void {
    delete this.vertexWrappers[vertexKey];
    this.posTracker.removeObject(vertexKey);
  }

  /**
   * Removes an edge from the CullingManager.
   * @param edgeKey - The key of the edge to remove
   */
  public removeEdge(edgeKey: string): void {
    delete this.edgeWrappers[edgeKey];
  }

  /**
   * Updates rendering of registered objects after the viewport has changed.
   */
  private positionOrZoomChanged(): void {
    const backgroundLeftX = - this.stageInterface.getStageX() / this.stageInterface.getScale();
    const backgroundTopY = - this.stageInterface.getStageY() / this.stageInterface.getScale();
    const backgroundRightX = this.stageInterface.getRendererWidth() / this.stageInterface.getScale() + backgroundLeftX;
    const backgroundBottomY = this.stageInterface.getRendererHeight() / this.stageInterface.getScale() + backgroundTopY;

    const verticesInBox = this.posTracker.whichVerticesOverlapBox(
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
