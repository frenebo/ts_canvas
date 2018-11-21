import { VertexWrapper } from "../vertexWrapper.js";
import { EdgeWrapper } from "../edgeWrapper.js";
import { ModelChangeRequest, ModelInfoResponseMap, ModelInfoRequestMap, ModelInfoRequestType } from "../../../interfaces.js";

export class SelectionManager {
  private static ghostAlpha = 0.5;

  private selectedVerticesObject: {[key: string]: VertexWrapper} = {};
  // private selectedVertices: VertexWrapper[] = [];
  private selectionDrag: null | {
    dx: number,
    dy: number,
    isClone: boolean
    ghosts: Map<VertexWrapper, PIXI.Sprite>;
  } = null;
  // private selectedEdges: EdgeWrapper[] = [];

  constructor(
    private getVertexWrappers: () => Readonly<{[key: string]: VertexWrapper}>,
    private getEdgeWrappers: () => Readonly<{[key: string]: EdgeWrapper}>,
    private sendModelChangeRequests: (...reqs: ModelChangeRequest[]) => void,
    private sendModelInfoRequest: <T extends ModelInfoRequestType>(req: ModelInfoRequestMap[T]) => ModelInfoResponseMap[T],
    private renderer: PIXI.WebGLRenderer | PIXI.CanvasRenderer,
  ) {
    // empty
  }

  public clearSelection(): void {
    // copy array so no vertices are skipped
    for (const selectedVertexId of Object.keys(this.selectedVerticesObject)) {
      this.deselectVertex(selectedVertexId);
    }
  }

  public vertexIsSelected(vertexId: string): boolean {
    return this.selectedVerticesObject[vertexId] !== undefined;
  }

  public selectVertex(vertexId: string): void {
    // only select if it isn't already selected
    if (this.selectedVerticesObject[vertexId] === undefined) {
      const vertex = this.getVertexWrappers()[vertexId];
      if (vertex === undefined) throw new Error(`No such vertex with id ${vertexId}`);

      this.selectedVerticesObject[vertexId] = vertex;
      vertex.toggleSelected(true);
    }
  }

  public deselectVertex(vertexId: string): void {
    // do nothing if the vertex isn't selected to begin with
    const vertex = this.selectedVerticesObject[vertexId];
    if (vertex !== undefined) {
      vertex.toggleSelected(false);
      delete this.selectedVerticesObject[vertexId];
    }
  }

  public addSelectionBox(leftX: number, topY: number, w: number, h: number): void {
    const vertexWrappers = this.getVertexWrappers();

    for (const vertexId in vertexWrappers) {
      const vertexWrapper = vertexWrappers[vertexId];

      if (
        vertexWrapper.localX() >= leftX &&
        vertexWrapper.localY() >= topY &&
        vertexWrapper.localX() + vertexWrapper.getWidth() <= leftX + w &&
        vertexWrapper.localY() + vertexWrapper.getHeight() <= topY + h
      ) {
        this.selectVertex(vertexId);
      }
    }
  }

  public startSelectionDrag(dx: number, dy: number, isClone: boolean): void {
    if (this.selectionDrag !== null) throw new Error("In middle of drag");

    this.selectionDrag = {
      dx: dx,
      dy: dy,
      isClone: isClone,
      ghosts: new Map(),
    };

    for (const selectedVertexId in this.selectedVerticesObject) {
      const selectedVertex = this.selectedVerticesObject[selectedVertexId];
      const ghost = new PIXI.Sprite(VertexWrapper.generateBoxTexture(SelectionManager.ghostAlpha, false, this.renderer));
      selectedVertex.addChild(ghost);
      ghost.position.set(dx, dy);

      this.selectionDrag.ghosts.set(selectedVertex, ghost);
    }
  }

  public continueSelectionDrag(dx: number, dy: number): void {
    if (this.selectionDrag === null) throw new Error("No drag currently happening");

    for (const [, ghost] of this.selectionDrag.ghosts) {
      ghost.position.set(dx, dy);
    }
  }

  private idOfVertex(vertexWrapper: VertexWrapper): string | null {
    const vertexWrappers = this.getVertexWrappers();
    for (const vertexId in vertexWrappers) {
      if (vertexWrappers[vertexId] === vertexWrapper) return vertexId;
    }

    return null;
  }

  public endSelectionDrag(dx: number, dy: number): void {
    if (this.selectionDrag === null) throw new Error("No drag currently happening");

    const requests: ModelChangeRequest[] = [];


    for (const [vertexWrapper, ghost] of this.selectionDrag.ghosts) {
      vertexWrapper.removeChild(ghost);
      const vertexId = this.idOfVertex(vertexWrapper);

      // if vertex no longer exists
      if (vertexId === null) continue;

      const newX = vertexWrapper.localX() + dx;
      const newY = vertexWrapper.localY() + dy;
      if (this.selectionDrag.isClone) {
        const uniqueVertexId = this.uniqueVtxId(); // should be different each time it's called

        requests.push({
          type: "cloneVertex",
          sourceVertexId: vertexId,
          newVertexId: uniqueVertexId,
          x: newX,
          y: newY,
        });
      } else {
        requests.push({
          type: "moveVertex",
          vertexId: vertexId,
          x: newX,
          y: newY,
        });
      }
    }

    this.sendModelChangeRequests(...requests);

    this.selectionDrag = null;
  }

  private static vtxIdCounter = 0;
  private uniqueVtxId(): string {
    while (true) {
      const id = "vertex" + SelectionManager.vtxIdCounter.toString();
      SelectionManager.vtxIdCounter++;
      if (this.getVertexWrappers()[id] === undefined) return id;
    }
  }

  // public addVertex(key: string, vertexWrapper: VertexWrapper): void {
  //   this.vertices[key] = vertexWrapper;
  //   vertexWrapper.toggleSelected(true);
  // }
  //
  // public addEdge(key: string, edgeWrapper: EdgeWrapper): void {
  //   this.edges[key] = edgeWrapper;
  //   edgeWrapper.toggleSelected(true);
  // }
  //
  // public removeEdge(key: string): void {
  //   const edgeWrapper = this.edges[key];
  //   if (edgeWrapper === undefined) throw new Error(`Edge ${key} is not selected`);
  //   delete this.edges[key];
  //
  //   edgeWrapper.toggleSelected(false);
  // }
  //
  // public removeVertex(key: string): void {
  //   const vertexWrapper = this.vertices[key];
  //   if (vertexWrapper === undefined) throw new Error(`Vertex ${key} is not selected`);
  //   delete this.vertices[key];
  //
  //   vertexWrapper.toggleSelected(false);
  // }
  //
  // public pruneVertexKeys(keysToKeep: string[]): void {
  //   for (const selectedVertexKey of Object.keys(this.vertices)) {
  //     if (keysToKeep.indexOf(selectedVertexKey) === -1) {
  //       this.removeVertex(selectedVertexKey);
  //     }
  //   }
  // }
  //
  // public pruneEdgeKeys(keysToKeep: string[]): void {
  //   for (const selectedEdgeKey of Object.keys(this.edges)) {
  //     if (keysToKeep.indexOf(selectedEdgeKey) === -1) {
  //       this.removeEdge(selectedEdgeKey);
  //     }
  //   }
  // }
}
