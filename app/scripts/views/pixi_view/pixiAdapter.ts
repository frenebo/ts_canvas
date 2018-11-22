import { VertexData, ModelChangeRequest, ModelInfoRequestType, ModelInfoRequestMap, ModelInfoResponseMap, EdgeData } from "../../interfaces.js";
import { VertexWrapper } from "./vertexWrapper.js";
import { BackgroundWrapper } from "./backgroundWrapper.js";
import { DragRegistry } from "./dragAndSelection/dragRegistry.js";
import { MenuBar } from "./menuBar.js";
import { EdgeWrapper } from "./edgeWrapper.js";
import { PortWrapper } from "./portWrapper.js";

export class PixiAdapter {
  private app: PIXI.Application;
  private backgroundWrapper: BackgroundWrapper;
  private menuBar: MenuBar;
  private dragRegistry: DragRegistry;

  private vertexWrappers: {
    [key: string]: VertexWrapper;
  } = {};

  private edgeWrappers: {
    [key: string]: EdgeWrapper;
  } = {};

  constructor(
    div: HTMLDivElement,
    sendModelChangeRequests: (...reqs: ModelChangeRequest[]) => void,
    sendModelInfoRequest: <T extends ModelInfoRequestType>(req: ModelInfoRequestMap[T]) => ModelInfoResponseMap[T],
  ) {
    this.app = new PIXI.Application(800, 600);
    div.appendChild(this.app.view);
    this.app.ticker.start(); // To continually refresh view

    this.backgroundWrapper = new BackgroundWrapper(this.app.renderer);
    this.backgroundWrapper.addTo(this.app.stage);

    this.dragRegistry = new DragRegistry(
      sendModelChangeRequests,
      sendModelInfoRequest,
      () => this.vertexWrappers,
      () => this.edgeWrappers,
      this.backgroundWrapper,
      this.app.renderer,
    );
    this.menuBar = new MenuBar(this.dragRegistry);
    this.menuBar.addTo(this.app.stage);
  }

  public removeVertex(vertexKey: string): void {
    const vertexWrapper = this.vertexWrappers[vertexKey];
    if (vertexWrapper === undefined) throw new Error(`No vertex found with key ${vertexKey}`);

    this.backgroundWrapper.removeVertex(vertexWrapper);
    delete this.vertexWrappers[vertexKey];

    this.dragRegistry.removeVertex(vertexKey, vertexWrapper);
  }

  public createVertex(vertexKey: string, data: VertexData): void {
    if (this.vertexWrappers.hasOwnProperty(vertexKey)) throw new Error(`Vertex with key ${vertexKey} already present`);

    const vtxWrapper = new VertexWrapper(
      this.dragRegistry,
      // @TODO find cleaner solution
      (vtx, portId, portWrapper) => this.dragRegistry.registerPort(vertexKey, vtx, portId, portWrapper),
      this.app.renderer,
    );
    this.vertexWrappers[vertexKey] = vtxWrapper;

    vtxWrapper.updateData(data);

    this.dragRegistry.registerVertex(vertexKey, vtxWrapper);

    this.backgroundWrapper.addVertex(vtxWrapper);
  }

  public updateVertex(vertexKey: string, data: VertexData): void {
    const graphicsVtx = this.vertexWrappers[vertexKey];
    if (graphicsVtx === undefined) throw new Error(`No such vertex found with key ${vertexKey}`);

    graphicsVtx.updateData(data);
  }

  public removeEdge(edgeKey: string): void {
    const edgeWrapper = this.edgeWrappers[edgeKey];
    if (edgeWrapper === undefined) throw new Error(`No edge found with key ${edgeKey}`);

    this.backgroundWrapper.removeEdge(edgeWrapper);
    delete this.edgeWrappers[edgeKey];

    this.dragRegistry.removeEdge(edgeKey, edgeWrapper);
  }

  public addEdge(edgeKey: string, edgeData: EdgeData): void {
    const sourceVertex = this.vertexWrappers[edgeData.sourceVertexId];
    const targetVertex = this.vertexWrappers[edgeData.targetVertexId];
    if (sourceVertex === undefined) throw new Error(`No vertex found with key ${edgeData.sourceVertexId}`);
    if (targetVertex === undefined) throw new Error(`No vertex found with key ${edgeData.targetVertexId}`);

    const sourcePort = sourceVertex.getPortWrapper(edgeData.sourcePortId);
    const targetPort = targetVertex.getPortWrapper(edgeData.targetPortId);

    const edgeWrapper = new EdgeWrapper(
      sourceVertex,
      sourcePort,
      targetVertex,
      targetPort,
      this.app.renderer,
    );
    this.dragRegistry.registerEdge(edgeKey, edgeWrapper);

    this.backgroundWrapper.addEdge(edgeWrapper);
    this.edgeWrappers[edgeKey] = edgeWrapper;
  }

  public refreshEdge(edgeId: string): void {
    this.edgeWrappers[edgeId].refresh();
  }
}
