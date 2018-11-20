import { VertexData } from "../../interfaces.js";
import { VertexDragHandler } from "./vertexDragHandler.js";
import { DragRegistry } from "./dragRegistry.js";
import { EditIcon } from "./icons/editIcon.js";

export class VertexWrapper {
  public static fillColor = 0xE6E6E6;
  public static borderColor = 0x333333;
  public static borderWidth = 5;
  public static defaultWidth = 250;
  public static defaultHeight = 80;

  private graphics: PIXI.Graphics;
  private width: number;
  private height: number;
  private dragListeners: Array<(x: number, y: number, ctrlKey: boolean) => void> = [];
  private label: PIXI.Text;
  private editIcon: EditIcon;

  constructor(data: VertexData, dragRegistry: DragRegistry) {
    this.graphics = new PIXI.Graphics();
    this.width = VertexWrapper.defaultWidth;
    this.height = VertexWrapper.defaultHeight;


    this.graphics.interactive = true;
    this.graphics.buttonMode = true;
    // this.graphics.hitArea = new PIXI.Rectangle(data.geo.w, data.geo.h);
    const dragHandler = new VertexDragHandler(this, dragRegistry);
    dragHandler.afterDrag((x: number, y: number, ctrlKey: boolean) => {
      for (const listener of this.dragListeners) {
        listener(x, y, ctrlKey);
      }
    });

    this.graphics.beginFill(VertexWrapper.fillColor);

    // set the line style to have a width of 5 and set the color to red
    this.graphics.lineStyle(VertexWrapper.borderWidth, VertexWrapper.borderColor);
    this.graphics.position.set(data.geo.x, data.geo.y);
    this.graphics.drawRoundedRect(0, 0, this.width, this.height, 10);

    const textStyle = new PIXI.TextStyle({
      fontFamily: 'Arial',
      fontSize: 30,
      // fontStyle: 'italic',
      fontWeight: 'bold',
      fill: ['#ffffff', '#00ff99'], // gradient
      stroke: '#4a1850',
      strokeThickness: 5,
      dropShadow: true,
      dropShadowColor: '#000000',
      dropShadowBlur: 4,
      // dropShadowAngle: Math.PI / 6,
      // dropShadowDistance: 6,
      // wordWrap: true,
      // wordWrapWidth: 440,
    });

    this.label = new PIXI.Text(data.label, textStyle);
    this.graphics.addChild(this.label);

    this.editIcon = new EditIcon(dragRegistry);
    this.editIcon.addTo(this.graphics);
    this.editIcon.addClickListener(() => {
      console.log("Edit icon clicked");
    });

    this.positionChildren();
  }

  private positionChildren(): void {
    const padding = (this.graphics.height - this.editIcon.getHeight())/2;
    this.editIcon.setPosition(this.graphics.width - (this.editIcon.getWidth() + padding), padding);
    const widthForLabel = this.graphics.width - (this.editIcon.getWidth() + padding);

    this.label.x = (widthForLabel - this.label.width)/2;
    this.label.y = (this.graphics.height - this.label.height)/2;
  }

  public updateData(data: VertexData): void {
    if (this.graphics.position.x !== data.geo.x || this.graphics.position.y !== data.geo.y) {
      this.graphics.position.set(data.geo.x, data.geo.y);
    }
    if (this.label.text !== data.label) {
      this.label.text = data.label;
      this.positionChildren();
    }
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

  public getDataRelativeLoc(data: PIXI.interaction.InteractionData): PIXI.Point {
    return data.getLocalPosition(this.graphics);
  }
}
