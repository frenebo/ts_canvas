import { VertexData, ModelChangeRequest, ModelInfoRequestType, ModelInfoRequestMap, ModelInfoResponseMap, EdgeData } from "../../interfaces.js";
import { VertexWrapper } from "./vertexWrapper.js";
import { BackgroundWrapper } from "./backgroundWrapper.js";
import { DragRegistry } from "./dragAndSelection/dragRegistry.js";
import { MenuBar } from "./menuBar.js";
import { EdgeWrapper } from "./edgeWrapper.js";
import { SelectionManager } from "./selectionManager.js";
import { PortWrapper } from "./portWrapper.js";

export class PixiAdapter {
  private app: PIXI.Application;
  private backgroundWrapper: BackgroundWrapper;
  private menuBar: MenuBar;
  private sendModelChangeRequest: (req: ModelChangeRequest) => void;
  private sendModelInfoRequest: <T extends ModelInfoRequestType>(req: ModelInfoRequestMap[T]) => ModelInfoResponseMap[T];
  private dragRegistry: DragRegistry;
  private selectionManager: SelectionManager;

  private vertexWrappers: {
    [key: string]: VertexWrapper;
  } = {};
  private edgeWrappers: {
    [key: string]: EdgeWrapper;
  } = {};

  constructor(
    div: HTMLDivElement,
    sendModelChangeRequest: (req: ModelChangeRequest) => void,
    sendModelInfoRequest: <T extends ModelInfoRequestType>(req: ModelInfoRequestMap[T]) => ModelInfoResponseMap[T],
  ) {
    this.sendModelChangeRequest = sendModelChangeRequest;
    this.sendModelInfoRequest = sendModelInfoRequest;
    this.app = new PIXI.Application(800, 600);
    div.appendChild(this.app.view);
    this.app.ticker.start(); // To continually refresh view

    this.backgroundWrapper = new BackgroundWrapper(div, this.app.renderer);
    this.backgroundWrapper.addTo(this.app.stage);

    this.dragRegistry = new DragRegistry(
      sendModelChangeRequest,
      sendModelInfoRequest,
      () => this.uniqueVtxId(),
      () => this.uniqueEdgeId(),
      (x, y) => this.portsByCloseness(x, y),
      this.backgroundWrapper,
    );
    this.menuBar = new MenuBar(this.dragRegistry);
    this.menuBar.addTo(this.app.stage);

    this.selectionManager = new SelectionManager();
  }

  public removeVertex(vertexKey: string): void {
    const vertexWrapper = this.vertexWrappers[vertexKey];
    if (vertexWrapper === undefined) throw new Error(`No vertex found with key ${vertexKey}`);

    this.backgroundWrapper.removeVertex(vertexWrapper);
    delete this.vertexWrappers[vertexKey];
  }

  public createVertex(vertexKey: string, data: VertexData): void {
    if (this.vertexWrappers.hasOwnProperty(vertexKey)) throw new Error(`Vertex with key ${vertexKey} already present`);

    const vtxWrapper = new VertexWrapper(
      data,
      this.dragRegistry,
      // @TODO find cleaner solution
      (vtx, portId, portWrapper) => this.dragRegistry.registerPort(vertexKey, vtx, portId, portWrapper),
      this.app.renderer,
    );
    this.vertexWrappers[vertexKey] = vtxWrapper;

    this.dragRegistry.registerVertex(vertexKey, vtxWrapper);



    this.backgroundWrapper.addVertex(vtxWrapper);
  }

  private uniqueVtxId(): string {
    let i = 0;
    while (true) {
      const id = "vertex" + i.toString();
      i++;
      if (this.vertexWrappers[id] === undefined) return id;
    }
  }

  private uniqueEdgeId(): string {
    let i = 0;
    while (true) {
      const id = "edge" + i.toString();

      i++;

      if (this.edgeWrappers[id] === undefined) return id;
    }
  }

  public updateVertex(vertexKey: string, data: VertexData): void {
    const graphicsVtx = this.vertexWrappers[vertexKey];
    if (graphicsVtx === undefined) throw new Error(`No such vertex found with key ${vertexKey}`);

    graphicsVtx.updateData(data);
  }

  private portsByCloseness(targetX: number, targetY: number): Array<{
    portKey: string,
    port: PortWrapper,
    vtxKey: string,
    vtx: VertexWrapper,
    distanceSquared: number,
  }> {
    const portDescriptions: Array<{
      portKey: string,
      port: PortWrapper,
      vtxKey: string,
      vtx: VertexWrapper,
      distanceSquared: number,
    }> = [];

    for (const vertexKey in this.vertexWrappers) {
      const vertexWrapper = this.vertexWrappers[vertexKey];
      for (const portKey of vertexWrapper.portKeys()) {
        const portWrapper = vertexWrapper.getPortWrapper(portKey);
        const xDistance = targetX - (portWrapper.localX() + vertexWrapper.localX() + portWrapper.getWidth()/2);
        const yDistance = targetY - (portWrapper.localY() + vertexWrapper.localY() + portWrapper.getHeight()/2);
        portDescriptions.push({
          portKey: portKey,
          port: portWrapper,
          vtxKey: vertexKey,
          vtx: vertexWrapper,
          distanceSquared: xDistance*xDistance + yDistance*yDistance,
        });
      }
    }

    const sortedDescriptions = portDescriptions.sort((d1, d2) => d1.distanceSquared - d2.distanceSquared);

    return sortedDescriptions;
  }

  public removeEdge(edgeKey: string): void {
    const edgeWrapper = this.edgeWrappers[edgeKey];
    if (edgeWrapper === undefined) throw new Error(`No edge found with key ${edgeKey}`);

    this.backgroundWrapper.removeEdge(edgeWrapper);
    delete this.edgeWrappers[edgeKey];
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
      this.dragRegistry,
    );
    this.dragRegistry.registerEdge(edgeKey, edgeWrapper);

    this.backgroundWrapper.addEdge(edgeWrapper);
    this.edgeWrappers[edgeKey] = edgeWrapper;
  }
}
