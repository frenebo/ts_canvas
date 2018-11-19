import { VertexData } from "../../interfaces.js";

export class PixiAdapter {
  private app: PIXI.Application;

  private graphicsVertices: {
    [key: string]: PIXI.Graphics;
  } = {};

  constructor(div: HTMLDivElement) {
    this.app = new PIXI.Application(800, 600, { resolution: window.devicePixelRatio || 1 });
    div.appendChild(this.app.view);
  }

  public removeVertex(vertexKey: string): void {
    const graphicsVertex = this.graphicsVertices[vertexKey];
    if (graphicsVertex === undefined) throw new Error(`No such vertex found with key ${vertexKey}`);

    delete this.graphicsVertices[vertexKey];
    this.app.stage.removeChild(graphicsVertex);
  }

  public createVertex(vertexKey: string, data: VertexData): void {
    const graphicsVertex = new PIXI.Graphics();
    if (this.graphicsVertices.hasOwnProperty(vertexKey)) throw new Error(`Vertex with key ${vertexKey} already present`);

    this.graphicsVertices[vertexKey] = graphicsVertex;

    // console.log(graphicsVertex.position);
    graphicsVertex.beginFill(0xFFFF00);

    // set the line style to have a width of 5 and set the color to red
    graphicsVertex.lineStyle(5, 0xFF0000);
    // graphicsVertex.moveTo(vertexData.geometry.x, vertexData.geometry.y);
    graphicsVertex.drawRoundedRect(data.geo.x, data.geo.y, data.geo.w, data.geo.h, 10);
    this.app.stage.addChild(graphicsVertex);
  }

  public updateVertex(vertexKey: string, data: VertexData): void {
    const graphicsVertex = this.graphicsVertices[vertexKey];
    if (graphicsVertex === undefined) throw new Error(`No such vertex found with key ${vertexKey}`);

    // graphicsVertex.
    console.log(graphicsVertex.getBounds());
    // data.geo
  }
}
