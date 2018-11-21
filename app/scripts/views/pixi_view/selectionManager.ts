import { VertexWrapper } from "./vertexWrapper";
import { EdgeWrapper } from "./edgeWrapper";

export class SelectionManager {
  private vertices: {
    [key: string]: VertexWrapper;
  } = {};

  private edges: {
    [key: string]: EdgeWrapper;
  } = {};

  constructor() {

  }

  public addVertex(key: string, vertexWrapper: VertexWrapper): void {
    this.vertices[key] = vertexWrapper;
    vertexWrapper.toggleSelected(true);
  }

  public addEdge(key: string, edgeWrapper: EdgeWrapper): void {
    this.edges[key] = edgeWrapper;
    edgeWrapper.toggleSelected(true);
  }

  public removeEdge(key: string): void {
    const edgeWrapper = this.edges[key];
    if (edgeWrapper === undefined) throw new Error(`Edge ${key} is not selected`);
    delete this.edges[key];

    edgeWrapper.toggleSelected(false);
  }

  public removeVertex(key: string): void {
    const vertexWrapper = this.vertices[key];
    if (vertexWrapper === undefined) throw new Error(`Vertex ${key} is not selected`);
    delete this.vertices[key];

    vertexWrapper.toggleSelected(false);
  }

  public pruneVertexKeys(keysToKeep: string[]): void {
    for (const selectedVertexKey of Object.keys(this.vertices)) {
      if (keysToKeep.indexOf(selectedVertexKey) === -1) {
        this.removeVertex(selectedVertexKey);
      }
    }
  }

  public pruneEdgeKeys(keysToKeep: string[]): void {
    for (const selectedEdgeKey of Object.keys(this.edges)) {
      if (keysToKeep.indexOf(selectedEdgeKey) === -1) {
        this.removeEdge(selectedEdgeKey);
      }
    }
  }
}
