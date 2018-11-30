import { VertexWrapper } from "./vertexWrapper";
import { EdgeWrapper } from "./edgeWrapper";
import { BackgroundWrapper } from "./backgroundWrapper";

class PositionTracker {
  public static getInsertionIndex<T>(arr: T[], comparator: (val: T) => number, prefer?: "start" | "end"): number {
    if (arr.length === 0) {
      return 0;
    }

    if (comparator(arr[0]) < 0) {
      return 0;
    }
    if (comparator(arr[arr.length -1]) > 0) {
      return arr.length;
    }

    let l = 0;
    let r = arr.length - 1;

    let insertPos: number;
    while (true) {
      const middle = (l + r) >> 1;
      const comp = comparator(arr[middle]);
      if (comp > 0) {
        if (comparator(arr[middle + 1]) < 0) {
          insertPos = middle + 1;
          break;
        } else {
          l = middle + 1;
        }
      } else if (comp < 0) {
        if (comparator(arr[middle - 1]) > 0) {
          insertPos = middle;
          break;
        } else {
          r = middle - 1;
        }
      } else {
        if (prefer === undefined) {
          insertPos = middle;
        } else if (prefer === "start") {
          let leftOfInsertion = middle - 1;
          while (leftOfInsertion > -1 && comparator(arr[leftOfInsertion]) === 0) {
            leftOfInsertion--;
          }
          insertPos = leftOfInsertion + 1;
        } else {
          let rightOfInsertion = middle + 1;
          while (rightOfInsertion < arr.length && comparator(arr[rightOfInsertion]) === 0) {
            rightOfInsertion++;
          }
          insertPos = rightOfInsertion + 1;
        }
        break;
      }
    }

    return insertPos;
  }

  private static binarySearch<T>(arr: T[], comparator: (val: T) => number): number | null {
    let left = 0;
    let right = arr.length - 1;

    while (left <= right) {
      const middle = Math.floor((left + right)/2);

      if (comparator(arr[middle]) < 0) {
        left = middle + 1;
      } else if (comparator(arr[middle]) > 0) {
        right = middle -1;
      } else {
        return middle;
      }
    }

    return null;
  }

  private objCorners: {[key: string]: {[key in "tl" | "bl" | "tr" |"br"]: {x: number, y: number}}} = {};

  constructor() {
    // empty
  }

  public addObject(
    key: string,
    left: number,
    right: number,
    top: number,
    bottom: number,
  ): void {
    const corners = {
      tl: { x: left, y: top },
      bl: { x: left, y: bottom },
      tr: { x: right, y: top },
      br: { x: right, y: bottom },
    };
    // @TODO add tiles to speed things up

    this.objCorners[key] = corners;
  }

  public updateObject(
    key: string,
    newLeft: number,
    newRight: number,
    newTop: number,
    newBottom: number,
  ): void {
    const oldTop = this.objCorners[key].tl.y;
    const oldLeft = this.objCorners[key].tl.x;
    const oldBottom = this.objCorners[key].br.y;
    const oldRight = this.objCorners[key].br.x;

    if (
      newLeft !== oldLeft ||
      newTop !== oldTop ||
      newRight !== oldRight ||
      newBottom !== oldBottom
    ) {
      this.removeObject(key);
      this.addObject(key, newLeft, newRight, newTop, newBottom);
    }
  }

  public removeObject(key: string): void {
    delete this.objCorners[key];
  }

  public filterVerticesInBox(boxLeft: number, boxRight: number, boxTop: number, boxBottom: number): Set<string> {
    return new Set(Object.keys(this.objCorners).filter(k => this.doesObjectOverlayBox(k, boxLeft, boxRight, boxTop, boxBottom)));
  }

  public doesObjectOverlayBox(objKey: string, boxLeft: number, boxRight: number, boxTop: number, boxBottom: number): boolean {
    const objLeft = this.objCorners[objKey].tl.x;
    const objTop = this.objCorners[objKey].tl.y;
    const objRight = this.objCorners[objKey].br.x;
    const objBottom = this.objCorners[objKey].br.y;

    return ((
      (boxLeft <= objLeft && objLeft <= boxRight) ||
      (boxLeft <= objRight && objRight <= boxRight) ||
      (boxTop <= objTop && objTop <= boxBottom) ||
      (boxTop <= objBottom && objBottom <= boxBottom)
    ) || (
      objLeft <= boxLeft &&
      objRight >= boxRight &&
      objTop <= boxTop &&
      objBottom >= boxBottom
    ));
  }
}

export class CullingManager {
  private vertexWrappers: {[key: string]: VertexWrapper} = {};
  private edgeWrappers: {[key: string]: EdgeWrapper} = {};
  private posTracker: PositionTracker;

  constructor(
    private readonly backgroundWrapper: BackgroundWrapper,
    private readonly renderer: PIXI.WebGLRenderer | PIXI.CanvasRenderer,
  ) {
    this.posTracker = new PositionTracker();
    const that = this;
    backgroundWrapper.onPositionOrZoomChanged(() => {
      that.onPositionOrZoomChanged();
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

  private onPositionOrZoomChanged(): void {
    const backgroundLeftX = - this.backgroundWrapper.localX()/this.backgroundWrapper.getScale();
    const backgroundTopY = - this.backgroundWrapper.localY()/this.backgroundWrapper.getScale();
    const backgroundRightX = this.renderer.width/this.backgroundWrapper.getScale() + backgroundLeftX;
    const backgroundBottomY = this.renderer.height/this.backgroundWrapper.getScale() + backgroundTopY;

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
