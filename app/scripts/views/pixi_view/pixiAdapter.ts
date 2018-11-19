import { VertexData, ModelChangeRequest } from "../../interfaces.js";
import { VertexWrapper } from "./vertexWrapper.js";
import { BackgroundWrapper } from "./backgroundWrapper.js";
import { DragRegistry } from "./dragRegistry.js";

export class PixiAdapter {
  private app: PIXI.Application;
  private backgroundWrapper: BackgroundWrapper;
  private sendModelChangeRequest: (req: ModelChangeRequest) => void;
  private dragRegistry: DragRegistry;

  private graphicsVertices: {
    [key: string]: VertexWrapper;
  } = {};

  constructor(div: HTMLDivElement, sendModelChangeRequest: (req: ModelChangeRequest) => void) {
    this.sendModelChangeRequest = sendModelChangeRequest;
    this.app = new PIXI.Application(800, 600, { resolution: window.devicePixelRatio || 1 });
    div.appendChild(this.app.view);
    this.dragRegistry = new DragRegistry();
    this.backgroundWrapper = new BackgroundWrapper(this.app.renderer.width, this.app.renderer.height, this.dragRegistry);
    this.backgroundWrapper.addTo(this.app.stage);

    this.app.ticker.start(); // To continually refresh view
  }

  public removeVertex(vertexKey: string): void {
    const graphicsVertex = this.graphicsVertices[vertexKey];
    if (graphicsVertex === undefined) throw new Error(`No such vertex found with key ${vertexKey}`);

    this.backgroundWrapper.removeVertex(graphicsVertex);
    delete this.graphicsVertices[vertexKey];
  }

  public createVertex(vertexKey: string, data: VertexData): void {
    if (this.graphicsVertices.hasOwnProperty(vertexKey)) throw new Error(`Vertex with key ${vertexKey} already present`);

    const vtxWrapper = new VertexWrapper(data, this.dragRegistry);
    this.graphicsVertices[vertexKey] = vtxWrapper;

    vtxWrapper.addDragListener((x: number, y: number, ctrlKey: boolean) => {
      if (ctrlKey) {
        this.sendModelChangeRequest({
          type: "cloneVertex",
          vertexId: vertexKey,
          x: x,
          y: y,
        })
      } else {
        this.sendModelChangeRequest({
          type: "moveVertex",
          vertexId: vertexKey,
          x: x,
          y: y,
        });
      }
    });

    this.backgroundWrapper.addVertex(vtxWrapper);
  }

  public updateVertex(vertexKey: string, data: VertexData): void {
    const graphicsVtx = this.graphicsVertices[vertexKey];
    if (graphicsVtx === undefined) throw new Error(`No such vertex found with key ${vertexKey}`);

    graphicsVtx.updateData(data);
  }
}
