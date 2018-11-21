import { VertexWrapper } from "../vertexWrapper.js";
import { EdgeWrapper } from "../edgeWrapper.js";

export class SelectionManager {
  private selectedVertices: VertexWrapper[] = [];
  // private selectedEdges: EdgeWrapper[] = [];

  constructor(
    private getVertexWrappers: () => Readonly<{[key: string]: VertexWrapper}>,
    private getEdgeWrappers: () => Readonly<{[key: string]: EdgeWrapper}>,
  ) {
    // empty
  }

  public clearSelection(): void {
    for (const selectedVertex of this.selectedVertices) {
      this.deselectVertex(selectedVertex);
    }
  }

  public selectVertex(vertex: VertexWrapper): void {
    // only select if it isn't already selected
    if (this.selectedVertices.indexOf(vertex) === -1) {
      this.selectedVertices.push(vertex);
      vertex.toggleSelected(true);
    }
  }

  public deselectVertex(vertex: VertexWrapper): void {
    if (this.selectedVertices.indexOf(vertex) !== -1) {
      this.selectedVertices.splice(this.selectedVertices.indexOf(vertex), 1);
      vertex.toggleSelected(false);
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
