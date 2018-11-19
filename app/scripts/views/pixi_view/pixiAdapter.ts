import { VertexData } from "../../interfaces.js";

export class PixiAdapter {
  private app: PIXI.Application;

  private graphicsVertices: {
    [key: string]: PIXI.Graphics;
  } = {};

  constructor(div: HTMLDivElement) {
    this.app = new PIXI.Application(800, 600, { resolution: window.devicePixelRatio || 1 });
    div.appendChild(this.app.view);

    this.app.ticker.start(); // To continually refresh view
  }

  public removeVertex(vertexKey: string): void {
    const graphicsVertex = this.graphicsVertices[vertexKey];
    if (graphicsVertex === undefined) throw new Error(`No such vertex found with key ${vertexKey}`);

    delete this.graphicsVertices[vertexKey];
    this.app.stage.removeChild(graphicsVertex);
  }

  public createVertex(vertexKey: string, data: VertexData): void {
    if (this.graphicsVertices.hasOwnProperty(vertexKey)) throw new Error(`Vertex with key ${vertexKey} already present`);

    const graphicsVertex = new PIXI.Graphics();
    this.graphicsVertices[vertexKey] = graphicsVertex;

    new VertexDragHandler(graphicsVertex);

    // console.log(graphicsVertex.position);
    graphicsVertex.beginFill(0xFFFF00);

    // set the line style to have a width of 5 and set the color to red
    graphicsVertex.lineStyle(5, 0xFF0000);
    graphicsVertex.position.set(data.geo.x, data.geo.y);
    graphicsVertex.drawRoundedRect(0, 0, data.geo.w, data.geo.h, 10);
    this.app.stage.addChild(graphicsVertex);
  }

  public updateVertex(vertexKey: string, data: VertexData): void {
    const graphicsVtx = this.graphicsVertices[vertexKey];
    if (graphicsVtx === undefined) throw new Error(`No such vertex found with key ${vertexKey}`);

    if (graphicsVtx.position.x !== data.geo.x || graphicsVtx.position.y !== data.geo.y) {
      graphicsVtx.position.set(data.geo.x, data.geo.y);
    }

    console.log(graphicsVtx.position);
  }
}

class VertexDragHandler {
  private vertex: PIXI.Graphics;
  private dragData: null | {
    startX: number;
    startY: number;
  } = null;

  constructor(vertex: PIXI.Graphics) {
    this.vertex = vertex;
    const that = this;

    this.vertex.interactive = true;
    this.vertex.buttonMode = true;

    this.vertex
      .on('mousedown',       (data: unknown) => that.onDragStart(data))
      .on('touchstart',      (data: unknown) => that.onDragStart(data))
      .on('mouseup',         (data: unknown) => that.onDragEnd(data))
      .on('mouseupoutside',  (data: unknown) => that.onDragEnd(data))
      .on('touchend',        (data: unknown) => that.onDragEnd(data))
      .on('touchendoutside', (data: unknown) => that.onDragEnd(data))
      .on('mousemove',       (data: unknown) => that.onDragMove(data))
      .on('touchmove',       (data: unknown) => that.onDragMove(data));
  }

  private onDragStart(data: unknown): void {
    console.log(data);
    // this.dragData = {
    //   startX:
    // }
    // console.log(args);
  }
  private onDragEnd(data: unknown): void {
    console.log(data);
  }
  private onDragMove(data: unknown): void {
    // console.log(args);
  }
}
