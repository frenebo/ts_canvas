import { VertexData, ModelChangeRequest } from "../../interfaces.js";
import { VertexWrapper } from "./vertexWrapper.js";

export class PixiAdapter {
  private app: PIXI.Application;
  private sendModelChangeRequest: (req: ModelChangeRequest) => void;

  private graphicsVertices: {
    [key: string]: VertexWrapper;
  } = {};

  constructor(div: HTMLDivElement, sendModelChangeRequest: (req: ModelChangeRequest) => void) {
    this.sendModelChangeRequest = sendModelChangeRequest;
    this.app = new PIXI.Application(800, 600, { resolution: window.devicePixelRatio || 1 });
    div.appendChild(this.app.view);

    this.app.ticker.start(); // To continually refresh view
  }

  public removeVertex(vertexKey: string): void {
    const graphicsVertex = this.graphicsVertices[vertexKey];
    if (graphicsVertex === undefined) throw new Error(`No such vertex found with key ${vertexKey}`);

    graphicsVertex.removeFrom(this.app.stage);
    delete this.graphicsVertices[vertexKey];
  }

  public createVertex(vertexKey: string, data: VertexData): void {
    if (this.graphicsVertices.hasOwnProperty(vertexKey)) throw new Error(`Vertex with key ${vertexKey} already present`);

    const vtxWrapper = new VertexWrapper(data);
    this.graphicsVertices[vertexKey] = vtxWrapper;

    vtxWrapper.addDragListener((x: number, y: number) => {
      this.sendModelChangeRequest({
        type: "moveVertex",
        vertexId: vertexKey,
        x: x,
        y: y,
      })
    });

    vtxWrapper.addAsChildTo(this.app.stage);
  }

  public updateVertex(vertexKey: string, data: VertexData): void {
    const graphicsVtx = this.graphicsVertices[vertexKey];
    if (graphicsVtx === undefined) throw new Error(`No such vertex found with key ${vertexKey}`);

    graphicsVtx.updateData(data);
  }
}
