import { VertexData, ModelChangeRequest } from "../../interfaces.js";
import { VertexWrapper } from "./vertexWrapper.js";
import { BackgroundWrapper } from "./backgroundWrapper.js";
import { DragRegistry } from "./dragRegistry.js";
import { MenuBar } from "./menuBar.js";
import { EdgeDrawHandler } from "./edgeDrawHandler.js";
import { PortWrapper } from "./portWrapper.js";

export class PixiAdapter {
  private app: PIXI.Application;
  private backgroundWrapper: BackgroundWrapper;
  private menuBar: MenuBar;
  private sendModelChangeRequest: (req: ModelChangeRequest) => void;
  private dragRegistry: DragRegistry;

  private vertexWrappers: {
    [key: string]: VertexWrapper;
  } = {};
  private edgeDrawHandler: EdgeDrawHandler;

  constructor(div: HTMLDivElement, sendModelChangeRequest: (req: ModelChangeRequest) => void) {
    this.sendModelChangeRequest = sendModelChangeRequest;
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
    const graphicsVertex = this.vertexWrappers[vertexKey];
    if (graphicsVertex === undefined) throw new Error(`No such vertex found with key ${vertexKey}`);

    this.backgroundWrapper.removeVertex(graphicsVertex);
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

    vtxWrapper.addPortDragStartListener((portId, cursorX, cursorY) => {
      const portWrapper = vtxWrapper.getPortWrapper(portId);
      this.edgeDrawHandler.beginDraw(vtxWrapper, portWrapper);
    });
    vtxWrapper.addPortDragMoveListener((portId, cursorX, cursorY) => {
      const cursorLocalX = (cursorX - this.backgroundWrapper.localX())/this.backgroundWrapper.localScale();
      const cursorLocalY = (cursorY - this.backgroundWrapper.localY())/this.backgroundWrapper.localScale();

      const closestPortInfo = this.portsByCloseness(cursorLocalX, cursorLocalY)[0];

      // snap to closest port
      if (
        (closestPortInfo.vtx !== vtxWrapper || closestPortInfo.port !== vtxWrapper.getPortWrapper(portId)) &&
        closestPortInfo.distanceSquared < 100
      ) {
        this.edgeDrawHandler.updateLineEnd(
          closestPortInfo.port.localX() + closestPortInfo.port.getWidth()/2 + closestPortInfo.vtx.localX(),
          closestPortInfo.port.localY() + closestPortInfo.port.getWidth()/2 + closestPortInfo.vtx.localY(),
        );
      } else {
        this.edgeDrawHandler.updateLineEnd(cursorLocalX, cursorLocalY);
      }
    });
    vtxWrapper.addPortDragEndListener((portId, cursorX, cursorY) => {
      this.edgeDrawHandler.endDrag();
    });

    this.backgroundWrapper.addVertex(vtxWrapper);
  }

  public updateVertex(vertexKey: string, data: VertexData): void {
    const graphicsVtx = this.vertexWrappers[vertexKey];
    if (graphicsVtx === undefined) throw new Error(`No such vertex found with key ${vertexKey}`);

    graphicsVtx.updateData(data);
  }

  private portsByCloseness(targetX: number, targetY: number) {
    const portDescriptions: Array<{
      port: PortWrapper,
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
          port: portWrapper,
          vtx: vertexWrapper,
          distanceSquared: xDistance*xDistance + yDistance*yDistance,
        });
      }
    }

    const sortedDescriptions = portDescriptions.sort((d1, d2) => d1.distanceSquared - d2.distanceSquared);

    return sortedDescriptions;
  }
}
