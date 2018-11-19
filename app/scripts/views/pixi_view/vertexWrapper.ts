import { VertexData } from "../../interfaces.js";
import { VertexDragHandler } from "./vertexDragHandler.js";
import { DragRegistry } from "./dragRegistry.js";

export class VertexWrapper {
  public static fillColor = 0xFFFF00;
  public static borderColor = 0xFF0000;
  public static borderWidth = 5;

  private graphics: PIXI.Graphics;
  private width: number;
  private height: number;
  private dragListeners: Array<(x: number, y: number, ctrlKey: boolean) => void> = [];

  constructor(data: VertexData, dragRegistry: DragRegistry) {
    this.graphics = new PIXI.Graphics();
    this.width = data.geo.w;
    this.height = data.geo.h;


    this.graphics.interactive = true;
    this.graphics.buttonMode = true;
    // this.graphics.hitArea = new PIXI.Rectangle(data.geo.w, data.geo.h);
    const dragHandler = new VertexDragHandler(this, dragRegistry);
    dragHandler.afterDrag((x: number, y: number, ctrlKey: boolean) => {
      for (const listener of this.dragListeners) {
        listener(x, y, ctrlKey);
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

  public addDragListener(listener: (x: number, y: number, ctrlKey: boolean) => void): void {
    this.dragListeners.push(listener);
  }

  public addTo(obj: PIXI.Container): void {
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
