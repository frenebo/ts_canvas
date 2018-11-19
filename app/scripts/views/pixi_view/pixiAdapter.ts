import { VertexData, ModelChangeRequest } from "../../interfaces.js";

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

class VertexWrapper {
  public static fillColor = 0xFFFF00;
  public static borderColor = 0xFF0000;
  public static borderWidth = 5;

  private graphics: PIXI.Graphics;
  private width: number;
  private height: number;
  private dragListeners: Array<(x: number, y: number) => void> = [];

  constructor(data: VertexData) {
    this.graphics = new PIXI.Graphics();
    this.width = data.geo.w;
    this.height = data.geo.h;


    this.graphics.interactive = true;
    this.graphics.buttonMode = true;
    const dragHandler = new VertexDragHandler(this);
    dragHandler.afterDrag((x: number, y: number) => {
      for (const listener of this.dragListeners) {
        listener(x, y);
      }
    })

    // console.log(graphicsVertex.position);
    this.graphics.beginFill(VertexWrapper.fillColor);

    // set the line style to have a width of 5 and set the color to red
    this.graphics.lineStyle(VertexWrapper.borderWidth, VertexWrapper.borderColor);
    this.graphics.position.set(data.geo.x, data.geo.y);
    this.graphics.drawRoundedRect(0, 0, data.geo.w, data.geo.h, 10);
  }

  public updateData(data: VertexData): void {
    if (this.graphics.position.x !== data.geo.x || this.graphics.position.y !== data.geo.y) {
      this.graphics.position.set(data.geo.x, data.geo.y);
    }
    this.width = data.geo.w;
    this.height = data.geo.h;
  }

  public addDragListener(listener: (x: number, y: number) => void): void {
    this.dragListeners.push(listener);
  }

  public addAsChildTo(obj: PIXI.Container): void {
    obj.addChild(this.graphics);
  }

  public removeFrom(obj: PIXI.Container): void {
    obj.removeChild(this.graphics);
  }

  public addChild(obj: PIXI.DisplayObject): void {
    this.graphics.addChild(obj);
  }

  public removeChild(obj: PIXI.DisplayObject): void {
    this.graphics.removeChild(obj);
  }

  public getX(): number {
    return this.graphics.position.x;
  }

  public getY(): number {
    return this.graphics.position.y;
  }

  public getWidth(): number {
    return this.width;
  }

  public getHeight(): number {
    return this.height;
  }

  public on(ev: string, fn: Function, context?: any): this {
    this.graphics.on(ev, fn, context);
    return this;
  }
}

class VertexDragHandler {
  private static ghostAlpha = 0.5;
  private vtxWrapper: VertexWrapper;

  private dragData: null | {
    mouseLocalPos: {
      x: number;
      y: number;
    };
    dragOutline: PIXI.Graphics;
  } = null;
  private moveListeners: Array<(x: number, y: number) => void> = [];

  constructor(vertex: VertexWrapper) {
    this.vtxWrapper = vertex;
    const that = this;

    this.vtxWrapper
      .on('mousedown',       (event: PIXI.interaction.InteractionEvent) => that.onDragStart(event))
      .on('touchstart',      (event: PIXI.interaction.InteractionEvent) => that.onDragStart(event))
      .on('mouseup',         (event: PIXI.interaction.InteractionEvent) => that.onDragEnd(event))
      .on('mouseupoutside',  (event: PIXI.interaction.InteractionEvent) => that.onDragEnd(event))
      .on('touchend',        (event: PIXI.interaction.InteractionEvent) => that.onDragEnd(event))
      .on('touchendoutside', (event: PIXI.interaction.InteractionEvent) => that.onDragEnd(event))
      .on('mousemove',       (event: PIXI.interaction.InteractionEvent) => that.onDragMove(event))
      .on('touchmove',       (event: PIXI.interaction.InteractionEvent) => that.onDragMove(event));
  }

  public afterDrag(listener: (x: number, y: number) => void): void {
    this.moveListeners.push(listener);
  }

  private onDragStart(event: PIXI.interaction.InteractionEvent): void {
    const dragOutline = new PIXI.Graphics();
    this.vtxWrapper.addChild(dragOutline);

    // console.log(graphicsVertex.position);
    dragOutline.beginFill(VertexWrapper.fillColor, VertexDragHandler.ghostAlpha);
    // set the line style to have a width of 5 and set the color to red
    dragOutline.lineStyle(VertexWrapper.borderWidth, VertexWrapper.borderColor);

    // dragOutline.position.set(this.vertex.graphics.position.x, this.vertex.graphics.position.y);
    dragOutline.drawRoundedRect(0, 0, this.vtxWrapper.getWidth(), this.vtxWrapper.getHeight(), 10);

    // console.log(event.data);
    this.dragData = {
      mouseLocalPos: {
        x: event.data.global.x - this.vtxWrapper.getX(),
        y: event.data.global.y - this.vtxWrapper.getY(),
      },
      dragOutline: dragOutline,
    };
  }

  private onDragEnd(event: PIXI.interaction.InteractionEvent): void {
    if (this.dragData === null) return;

    this.vtxWrapper.removeChild(this.dragData.dragOutline);

    const newVertexX = event.data.global.x - this.dragData.mouseLocalPos.x;
    const newVertexY = event.data.global.y - this.dragData.mouseLocalPos.y;


    for (const listener of this.moveListeners) {
      listener(newVertexX, newVertexY);
    }

    this.dragData = null;
  }

  private onDragMove(event: PIXI.interaction.InteractionEvent): void {
    if (this.dragData === null) return;

    const relativeX = (event.data.global.x - this.dragData.mouseLocalPos.x) - this.vtxWrapper.getX();
    const relativeY = (event.data.global.y - this.dragData.mouseLocalPos.y) - this.vtxWrapper.getY();

    this.dragData.dragOutline.position.set(relativeX, relativeY);
  }
}
