import { VertexData, ModelChangeRequest, ModelInfoRequestType, ModelInfoRequestMap, ModelInfoResponseMap, EdgeData } from "../../interfaces.js";
import { VertexWrapper } from "./vertexWrapper.js";
import { BackgroundWrapper } from "./backgroundWrapper.js";
import { DragRegistry } from "./dragRegistry.js";
import { MenuBar } from "./menuBar.js";
import { EdgeDrawHandler } from "./edgeDrawHandler.js";
import { PortWrapper } from "./portWrapper.js";
import { EdgeWrapper } from "./edgeWrapper.js";

export class PixiAdapter {
  private app: PIXI.Application;
  private backgroundWrapper: BackgroundWrapper;
  private menuBar: MenuBar;
  private sendModelChangeRequest: (req: ModelChangeRequest) => void;
  private sendModelInfoRequest: <T extends ModelInfoRequestType>(req: ModelInfoRequestMap[T]) => ModelInfoResponseMap[T];
  private dragRegistry: DragRegistry;

  private vertexWrappers: {
    [key: string]: VertexWrapper;
  } = {};
  private edgeWrappers: {
    [key: string]: EdgeWrapper;
  } = {};
  private edgeDrawHandler: EdgeDrawHandler;

  constructor(
    div: HTMLDivElement,
    sendModelChangeRequest: (req: ModelChangeRequest) => void,
    sendModelInfoRequest: <T extends ModelInfoRequestType>(req: ModelInfoRequestMap[T]) => ModelInfoResponseMap[T],
  ) {
    this.sendModelChangeRequest = sendModelChangeRequest;
    this.sendModelInfoRequest = sendModelInfoRequest;
    this.dragRegistry = new DragRegistry();
    this.app = new PIXI.Application(800, 600);
    div.appendChild(this.app.view);
    this.app.ticker.start(); // To continually refresh view

    this.backgroundWrapper = new BackgroundWrapper(this.dragRegistry, div, this.app.renderer);
    this.backgroundWrapper.addTo(this.app.stage);

    this.menuBar = new MenuBar(this.dragRegistry);
    this.menuBar.addTo(this.app.stage);

    this.edgeDrawHandler = new EdgeDrawHandler(this.backgroundWrapper);
  }

  public removeVertex(vertexKey: string): void {
    const vertexWrapper = this.vertexWrappers[vertexKey];
    if (vertexWrapper === undefined) throw new Error(`No vertex found with key ${vertexKey}`);

    this.backgroundWrapper.removeVertex(vertexWrapper);
    delete this.vertexWrappers[vertexKey];
  }

  public createVertex(vertexKey: string, data: VertexData): void {
    if (this.vertexWrappers.hasOwnProperty(vertexKey)) throw new Error(`Vertex with key ${vertexKey} already present`);

    const vtxWrapper = new VertexWrapper(data, this.dragRegistry, this.app.renderer);
    this.vertexWrappers[vertexKey] = vtxWrapper;

    vtxWrapper.addDragListener((x: number, y: number, ctrlKey: boolean) => {
      if (ctrlKey) {
        this.sendModelChangeRequest({
          type: "cloneVertex",
          vertexId: vertexKey,
          x: x,
          y: y,
        });
      } else {
        this.sendModelChangeRequest({
          type: "moveVertex",
          vertexId: vertexKey,
          x: x,
          y: y,
        });
      }
    });

    vtxWrapper.addPortDragStartListener((sourcePortId, cursorX, cursorY) => {
      const portWrapper = vtxWrapper.getPortWrapper(sourcePortId);
      this.edgeDrawHandler.beginDraw(vtxWrapper, portWrapper);
    });

    const getSnapPortInfo = (cursorLocalX: number, cursorLocalY: number, sourcePortId: string) => {

      const closestInfo = this.portsByCloseness(cursorLocalX, cursorLocalY)[0];

      const closestPortVertex = this.vertexWrappers[closestInfo.vtxKey];
      const closestPort = closestPortVertex.getPortWrapper(closestInfo.portKey);

      if (
        (closestPortVertex !== vtxWrapper || closestPort !== vtxWrapper.getPortWrapper(sourcePortId)) &&
        closestInfo.distanceSquared < 100
      ) {
        const edgeValidityInfo = this.sendModelInfoRequest({
          type: "validateEdge",
          sourceVertexId: vertexKey,
          sourcePortId: sourcePortId,
          targetVertexId: closestInfo.vtxKey,
          targetPortId: closestInfo.portKey,
        });

        return {
          targetVtx: closestPortVertex,
          targetPort: closestPort,
          targetVtxId: closestInfo.vtxKey,
          targetPortId: closestInfo.portKey,
          xPos: closestPort.localX() + closestPort.getWidth()/2 + closestPortVertex.localX(),
          yPos: closestPort.localY() + closestPort.getWidth()/2 + closestPortVertex.localY(),
          isValid: edgeValidityInfo.validity === "valid",
        }
      } else {
        return null;
      }
    }

    vtxWrapper.addPortDragMoveListener((sourcePortId, cursorX, cursorY) => {
      const cursorLocalX = (cursorX - this.backgroundWrapper.localX())/this.backgroundWrapper.localScale();
      const cursorLocalY = (cursorY - this.backgroundWrapper.localY())/this.backgroundWrapper.localScale();
      const snapPortInfo = getSnapPortInfo(cursorLocalX, cursorLocalY, sourcePortId);

      // snap to closest port
      if (snapPortInfo !== null) {
        this.edgeDrawHandler.redrawLine(
          snapPortInfo.xPos,
          snapPortInfo.yPos,
          snapPortInfo.isValid ? "valid" : "invalid",
        );
      } else {
        this.edgeDrawHandler.redrawLine(cursorLocalX, cursorLocalY);
      }
    });
    vtxWrapper.addPortDragEndListener((sourcePortId, cursorX, cursorY) => {
      this.edgeDrawHandler.endDrag();

      const cursorLocalX = (cursorX - this.backgroundWrapper.localX())/this.backgroundWrapper.localScale();
      const cursorLocalY = (cursorY - this.backgroundWrapper.localY())/this.backgroundWrapper.localScale();

      const snapPortInfo = getSnapPortInfo(cursorLocalX, cursorLocalY, sourcePortId);

      if (snapPortInfo !== null && snapPortInfo.isValid) {
        this.sendModelChangeRequest({
          newPortId: this.uniqueEdgeId(),
          type: "createEdge",
          sourceVertexId: vertexKey,
          sourcePortId: sourcePortId,
          targetVertexId: snapPortInfo.targetVtxId,
          targetPortId: snapPortInfo.targetPortId,
        });
      }
    });

    this.backgroundWrapper.addVertex(vtxWrapper);
  }

  private uniqueEdgeId() {
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

  private portsByCloseness(targetX: number, targetY: number) {
    const portDescriptions: Array<{
      portKey: string,
      vtxKey: string,
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
          vtxKey: vertexKey,
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

    this.backgroundWrapper.addEdge(edgeWrapper);
    this.edgeWrappers[edgeKey] = edgeWrapper;
  }
}
