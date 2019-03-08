
import {
  RequestInfoFunc,
  RequestModelChangesFunc,
} from "../messenger.js";
import { EdgeWrapper } from "./graphicWrappers/edgeWrapper.js";
import { VtxBackgroundWrapper } from "./graphicWrappers/vertexBackgroundWrapper.js";
import { VertexWrapper } from "./graphicWrappers/vertexWrapper.js";
import { StageInterface } from "./stageInterface.js";

export class SelectionManager {
  private static readonly ghostAlpha = 0.5;

  private readonly selectedVertices: {[key: string]: VertexWrapper} = {};
  private readonly selectedEdges: {[key: string]: EdgeWrapper} = {};

  private selectionDrag: null | {
    dx: number;
    dy: number;
    isClone: boolean;
    ghostRoot: PIXI.Container;
    ghosts: Map<string, VtxBackgroundWrapper>;
  } = null;

  constructor(
    private readonly getVertexWrappers: () => Readonly<{[key: string]: VertexWrapper}>,
    private readonly getEdgeWrappers: () => Readonly<{[key: string]: EdgeWrapper}>,
    private readonly sendModelChangeRequests: RequestModelChangesFunc,
    private readonly sendModelInfoRequests: RequestInfoFunc,
    private readonly stageInterface: StageInterface,
  ) {
    // empty
  }

  // call when an edge has been removed, but still may be in selectedEdges

  public removeDeletedEdge(id: string, edge: EdgeWrapper): void {
    if (this.selectedEdges[id] !== undefined) {
      delete this.selectedEdges[id];
    }
  }

  // call when a vertex has been removed, but still may be in selectedVertices

  public removeDeletedVertex(id: string): void {
    if (this.selectedVertices[id] !== undefined) {
      delete this.selectedVertices[id];
    }

    if (this.selectionDrag !== null && this.selectionDrag.ghosts.has(id)) {
      const ghost = this.selectionDrag.ghosts.get(id)!;
      this.selectionDrag.ghosts.delete(id);
      this.selectionDrag.ghostRoot.removeChild(ghost.getDisplayObject());
    }
  }

  public clearSelection(): void {
    // copy array so no vertices are skipped
    for (const selectedVertexId of Object.keys(this.selectedVertices)) {
      this.deselectVertex(selectedVertexId);
    }

    for (const selectedEdgeId of Object.keys(this.selectedEdges)) {
      this.deselectEdge(selectedEdgeId);
    }
  }

  public vertexIsSelected(vertexId: string): boolean {
    return this.selectedVertices[vertexId] !== undefined;
  }

  public edgeIsSelected(edgeId: string): boolean {
    return this.selectedEdges[edgeId] !== undefined;
  }

  public selectEdge(edgeId: string): void {
    if (this.selectedEdges[edgeId] === undefined) {
      const edge = this.getEdgeWrappers()[edgeId];
      if (edge === undefined) {
        throw new Error(`Couldn't find edge with id ${edgeId}`);
      }

      this.selectedEdges[edgeId] = edge;
      edge.toggleSelected(true);
    }
  }

  public deselectEdge(edgeId: string): void {
    const edge = this.selectedEdges[edgeId];
    if (edge !== undefined) {
      edge.toggleSelected(false);
      delete this.selectedEdges[edgeId];
    }
  }

  public selectVertex(vertexId: string): void {
    // only select if it isn't already selected
    if (this.selectedVertices[vertexId] === undefined) {
      const vertex = this.getVertexWrappers()[vertexId];
      if (vertex === undefined) {
        throw new Error(`No such vertex with id ${vertexId}`);
      }

      this.selectedVertices[vertexId] = vertex;
      vertex.toggleSelected(true);
    }
  }

  public deselectVertex(vertexId: string): void {
    // do nothing if the vertex isn't selected to begin with
    const vertex = this.selectedVertices[vertexId];
    if (vertex !== undefined) {
      vertex.toggleSelected(false);
      delete this.selectedVertices[vertexId];
    }
  }

  public addSelectionBox(leftX: number, topY: number, w: number, h: number): void {
    const vertexWrappers = this.getVertexWrappers();

    for (const vertexId of Object.keys(vertexWrappers)) {
      const vertexWrapper = vertexWrappers[vertexId];

      if (
        vertexWrapper.localX() >= leftX &&
        vertexWrapper.localY() >= topY &&
        vertexWrapper.localX() + VertexWrapper.width <= leftX + w &&
        vertexWrapper.localY() + VertexWrapper.height <= topY + h
      ) {
        this.selectVertex(vertexId);
      }
    }
  }

  public startSelectionDrag(dx: number, dy: number, isClone: boolean): void {
    if (this.selectionDrag !== null) {
      throw new Error("In middle of drag");
    }

    const ghostRoot = new PIXI.Container();
    this.stageInterface.addDisplayObject(ghostRoot);
    ghostRoot.position.set(dx, dy);

    this.selectionDrag = {
      dx: dx,
      dy: dy,
      ghostRoot: ghostRoot,
      ghosts: new Map(),
      isClone: isClone,
    };

    for (const selectedVertexId of Object.keys(this.selectedVertices)) {
      const selectedVertex = this.selectedVertices[selectedVertexId];
      const ghost = new VtxBackgroundWrapper(this.stageInterface);
      ghost.redraw(
        false,
        VertexWrapper.width,
        VertexWrapper.height,
        SelectionManager.ghostAlpha,
      );
      ghostRoot.addChild(ghost.getDisplayObject());
      ghost.setPosition(
        selectedVertex.localX(),
        selectedVertex.localY(),
      );

      this.selectionDrag.ghosts.set(selectedVertexId, ghost);
    }
  }

  public continueSelectionDrag(dx: number, dy: number): void {
    if (this.selectionDrag === null) {
      throw new Error("No drag currently happening");
    }

    this.selectionDrag.ghostRoot.position.set(dx, dy);
  }

  public abortSelectionDrag(): void {
    if (this.selectionDrag === null) {
      return;
    }

    this.stageInterface.removeDisplayObject(this.selectionDrag.ghostRoot);

    this.selectionDrag = null;
  }

  public async endSelectionDrag(dx: number, dy: number): Promise<void> {
    if (this.selectionDrag === null) {
      throw new Error("No drag currently happening");
    }

    this.stageInterface.removeDisplayObject(this.selectionDrag.ghostRoot);

    const vertexIds = Array.from(this.selectionDrag.ghosts.keys());

    const isClone = this.selectionDrag.isClone;
    this.selectionDrag = null;
    if (isClone) {
      const requests: ModelChangeRequest[] = [];

      const newVertexIds = await this.sendModelInfoRequests<"getUniqueVertexIds">({
        count: vertexIds.length,
        type: "getUniqueVertexIds",
      });

      const origToCloneIds: {[key: string]: string} = {};

      for (let i = 0; i < vertexIds.length; i++) {
        const vertexIdToClone = vertexIds[i];
        const vertexWrapper = this.getVertexWrappers()[vertexIdToClone];
        const newX = vertexWrapper.localX() + dx;
        const newY = vertexWrapper.localY() + dy;

        const uniqueId = newVertexIds.vertexIds[i];
        origToCloneIds[vertexIdToClone] = uniqueId;

        requests.push({
          newVertexId: uniqueId,
          sourceVertexId: vertexIdToClone,
          type: "cloneVertex",
          x: newX,
          y: newY,
        });
      }

      let requestIds: string[] = vertexIds.slice();
      let edgesToClone: {[key: string]: IEdgeData} | null = null;
      while (edgesToClone === null) {
        const requestData = await this.sendModelInfoRequests<"edgesBetweenVertices">({
          type: "edgesBetweenVertices",
          vertexIds: requestIds,
        });
        if (requestData.verticesExist) {
          edgesToClone = requestData.edges;
        } else {
          requestIds = requestIds.filter((id) => requestData.requestNonexistentVertices.indexOf(id) === -1);
        }
      }

      const edgesToCloneIds = Object.keys(edgesToClone);
      const newEdgeIds = await this.sendModelInfoRequests<"getUniqueEdgeIds">({
        count: edgesToCloneIds.length,
        type: "getUniqueEdgeIds",
      });

      for (let i = 0; i < edgesToCloneIds.length; i++) {
        const edgeToCloneId = edgesToCloneIds[i];
        const edgeData = edgesToClone[edgeToCloneId];
        const newEdgeId = newEdgeIds.edgeIds[i];

        requests.push({
          newEdgeId: newEdgeId,
          sourcePortId: edgeData.sourcePortId,
          sourceVertexId: origToCloneIds[edgeData.sourceVertexId],
          targetPortId: edgeData.targetPortId,
          targetVertexId: origToCloneIds[edgeData.targetVertexId],
          type: "createEdge",
        });
      }

      this.sendModelChangeRequests(...requests).catch((reason) => {
        throw new Error(`Failed to send model change requests: ${reason}`);
      });
    } else {
      const requests: ModelChangeRequest[] = [];

      for (const vertexId of vertexIds) {
        const vertexWrapper = this.getVertexWrappers()[vertexId];
        const newX = vertexWrapper.localX() + dx;
        const newY = vertexWrapper.localY() + dy;

        requests.push({
          type: "moveVertex",
          vertexId: vertexId,
          x: newX,
          y: newY,
        });
      }

      this.sendModelChangeRequests(...requests).catch((reason) => {
        throw new Error(`Failed to send model change requests: ${reason}`);
      });
    }
  }

  public selectAll(): void {
    for (const vertexId of Object.keys(this.getVertexWrappers())) {
      this.selectVertex(vertexId);
    }
    for (const edgeId of Object.keys(this.getEdgeWrappers())) {
      this.selectEdge(edgeId);
    }
  }

  public deleteSelection(): void {
    const requests: ModelChangeRequest[] = [];

    for (const edgeId of Object.keys(this.selectedEdges)) {
      requests.push({
        edgeId: edgeId,
        type: "deleteEdge",
      });
    }

    for (const vertexId of Object.keys(this.selectedVertices)) {
      requests.push({
        type: "deleteVertex",
        vertexId: vertexId,
      });
    }

    this.sendModelChangeRequests(...requests).catch((reason) => {
      throw new Error(`Failed to send model change requests: ${reason}`);
    });
  }
}
