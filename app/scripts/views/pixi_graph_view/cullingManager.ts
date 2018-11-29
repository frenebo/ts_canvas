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

  private cornersByX: Array<{x: number, vtx: string, corner: "tl" | "bl" | "tr" | "br"}> = [];
  private cornersByY: Array<{y: number, vtx: string, corner: "tl" | "bl" | "tr" | "br"}> = [];
  private vertexCorners: {[key: string]: {[key in "tl" | "bl" | "tr" |"br"]: {x: number, y: number}}} = {};

  constructor() {
  }

  public addVertex(
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

    for (const cornerType in corners) {
      const corner = corners[cornerType as "tl" | "bl" | "tr" | "br"];

      const idxInX = PositionTracker.getInsertionIndex(this.cornersByX, (val) => {
        return corner.x - val.x;
      });
      const idxInY = PositionTracker.getInsertionIndex(this.cornersByY, (val) => {
        return corner.y - val.y;
      });

      this.cornersByX.splice(idxInX, 0, {x: corner.x, vtx: key, corner: cornerType as "tl" | "bl" | "tr" | "br"});
      this.cornersByY.splice(idxInY, 0, {y: corner.y, vtx: key, corner: cornerType as "tl" | "bl" | "tr" | "br"});
    }

    this.vertexCorners[key] = corners;
  }

  public updateVertex(
    key: string,
    newLeft: number,
    newRight: number,
    newTop: number,
    newBottom: number,
  ): void {
    const oldTop = this.vertexCorners[key].tl.y;
    const oldLeft = this.vertexCorners[key].tl.x;
    const oldBottom = this.vertexCorners[key].br.y;
    const oldRight = this.vertexCorners[key].br.x;

    if (
      newLeft !== oldLeft ||
      newTop !== oldTop ||
      newRight !== oldRight ||
      newBottom !== oldBottom
    ) {
      this.removeVertex(key);
      this.addVertex(key, newLeft, newRight, newTop, newBottom);
    }
  }

  public removeVertex(key: string): void {
    const xIndices: number[] = [];
    const yIndices: number[] = [];
    for (const cornerType of ["tl", "bl", "tr", "br"]) {
      const x = this.vertexCorners[key][cornerType as "tl" | "bl" | "tr" | "br"].x;
      const y = this.vertexCorners[key][cornerType as "tl" | "bl" | "tr" | "br"].y;
      const xStartBounds = PositionTracker.getInsertionIndex(this.cornersByX, (val) => x - val.x, "start");
      const xEndBounds = PositionTracker.getInsertionIndex(this.cornersByX, (val) => x - val.x, "end");
      const yStartBounds = PositionTracker.getInsertionIndex(this.cornersByY, (val) => y - val.y, "start");
      const yEndBounds = PositionTracker.getInsertionIndex(this.cornersByY, (val) => y - val.y, "end");

      let xIdx: number;
      for (xIdx = xStartBounds; xIdx < xEndBounds; xIdx++) {
        if (this.cornersByX[xIdx].vtx === key && this.cornersByX[xIdx].corner === cornerType) break;
      }

      let yIdx: number;
      for (yIdx = yStartBounds; yIdx < yEndBounds; yIdx++) {
        if (this.cornersByY[yIdx].vtx === key && this.cornersByY[yIdx].corner === cornerType) break;
      }

      xIndices.push(xIdx);
      yIndices.push(yIdx);
    }

    for (const xIdx of xIndices.sort().reverse()) {
      this.cornersByX.splice(xIdx, 1);
    }

    for (const yIdx of yIndices.sort().reverse()) {
      this.cornersByY.splice(yIdx, 1);
    }

    delete this.vertexCorners[key];
  }

  public filterVerticesInBox(boxLeft: number, boxRight: number, boxTop: number, boxBottom: number): Set<string> {
    const leftCutoffIdx = PositionTracker.getInsertionIndex(this.cornersByX, (val) => {
      return boxLeft - val.x;
    }, "start");
    const rightCutoffIdx = PositionTracker.getInsertionIndex(this.cornersByX, (val) => {
      return boxRight - val.x;
    }, "end");
    const topCutoffIdx = PositionTracker.getInsertionIndex(this.cornersByY, (val) => {
      return boxTop - val.y;
    }, "start");
    const bottomCutoffIdx = PositionTracker.getInsertionIndex(this.cornersByY, (val) => {
      return boxBottom - val.y;
    }, "end");

    const betweenLeftAndRight = new Set<string>(this.cornersByX.slice(leftCutoffIdx, rightCutoffIdx).map((v) => v.vtx));
    const betweenTopAndBottom = new Set<string>(this.cornersByY.slice(topCutoffIdx, bottomCutoffIdx).map((v) => v.vtx));

    const vertexIdsInBox = new Set<string>();
    for (const vtxId of betweenLeftAndRight) {
      if (betweenTopAndBottom.has(vtxId)) {
        vertexIdsInBox.add(vtxId);
      }
    }

    return vertexIdsInBox;
  }

  public doesVertexOverlayBox(vtxKey: string, boxLeft: number, boxRight: number, boxTop: number, boxBottom: number): boolean {
    const vtxLeft = this.vertexCorners[vtxKey].tl.x;
    const vtxTop = this.vertexCorners[vtxKey].tl.y;
    const vtxRight = this.vertexCorners[vtxKey].br.x;
    const vtxBottom = this.vertexCorners[vtxKey].br.y;

    return (
      (boxLeft <= vtxLeft && vtxLeft <= boxRight) ||
      (boxLeft <= vtxRight && vtxRight <= boxRight) ||
      (boxTop <= vtxTop && vtxTop <= boxBottom) ||
      (boxTop <= vtxBottom && vtxBottom <= boxBottom)
    );
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
    // const unsorted = [4, 2, 3, 4, 12, 4, 5, 345, 6, 4, 12, 345];
    // const sorted: number[] = [];

    // for (const unsortedVal of unsorted) {
    //   console.log(unsortedVal);
    //   const idx = PositionTracker.getInsertionIndex(sorted, v => unsortedVal - v);
    //   sorted.splice(idx, 0, unsortedVal);
    // }
    //
    // console.log(sorted)
  }

  public registerVertex(vertexKey: string, vertex: VertexWrapper): void {
    this.vertexWrappers[vertexKey] = vertex;
    this.posTracker.addVertex(
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
    this.posTracker.updateVertex(
      vertexKey,
      vtxLeft,
      vtxRight,
      vtxTop,
      vtxBottom,
    );

    vertex.setVisible(this.posTracker.doesVertexOverlayBox(
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
    this.posTracker.removeVertex(vertexKey);
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
        console.log("visible");
        this.vertexWrappers[vertexId].setVisible(true);
      } else {
        console.log("invisible");
        this.vertexWrappers[vertexId].setVisible(false);
      }
    }

    // for (const vertexId in this.vertexWrappers) {
    //   const vertexWrapper = this.vertexWrappers[vertexId];
    //   if (
    //     vertexWrapper.localX() + vertexWrapper.localBounds().x > backgroundRightX ||
    //     vertexWrapper.localX() + vertexWrapper.localBounds().x + vertexWrapper.localBounds().width < backgroundLeftX ||
    //     vertexWrapper.localY() + vertexWrapper.localBounds().y > backgroundBottomY ||
    //     vertexWrapper.localY() + vertexWrapper.localBounds().y + vertexWrapper.localBounds().height < backgroundTopY
    //   ) {
    //     vertexWrapper.setVisible(false);
    //   } else {
    //     vertexWrapper.setVisible(true);
    //   }
    // }
    //
    // for (const edgeId in this.edgeWrappers) {
    //   const edgeWrapper = this.edgeWrappers[edgeId];
    //   if (
    //     edgeWrapper.localX() + edgeWrapper.localBounds().x > backgroundRightX ||
    //     edgeWrapper.localX() + edgeWrapper.localBounds().x + edgeWrapper.localBounds().width < backgroundLeftX ||
    //     edgeWrapper.localY() + edgeWrapper.localBounds().y > backgroundBottomY ||
    //     edgeWrapper.localY() + edgeWrapper.localBounds().y + edgeWrapper.localBounds().height < backgroundTopY
    //   ) {
    //     edgeWrapper.setVisible(false);
    //   } else {
    //     edgeWrapper.setVisible(true);
    //   }
    // }
    // console.log(
    //   backgroundTopLeftX,
    //   backgroundTopLeftY,
    //   backgroundBottomRightX,
    //   backgroundBottomRightY,
    // );
  }
}
