import { VertexData, PortData } from "../../interfaces.js";
import { DragRegistry } from "./dragAndSelection/dragRegistry.js";
import { EditIcon } from "./icons/editIcon.js";
import { PortWrapper } from "./portWrapper.js";

export class VertexWrapper {
  private static unselectedFillColor = 0xE6E6E6;
  private static selectedFillColor = 0xFFFF00;
  private static borderColor = 0x333333;
  private static borderWidth = 5;
  private static defaultWidth = 250;
  private static defaultHeight = 80;

  public static generateBoxGraphics(alpha: number = 1, selected = false) {
    const graphics = new PIXI.Graphics();
    const fillColor = selected ? VertexWrapper.selectedFillColor : VertexWrapper.unselectedFillColor;
    graphics.beginFill(fillColor, alpha);
    graphics.lineStyle(VertexWrapper.borderWidth, VertexWrapper.borderColor);
    graphics.drawRoundedRect(
      0 + VertexWrapper.borderWidth/2,
      0 + VertexWrapper.borderWidth/2,
      VertexWrapper.defaultWidth + VertexWrapper.borderWidth/2,
      VertexWrapper.defaultHeight + VertexWrapper.borderWidth/2,
      10,
    );

    return graphics;
  }

  private renderer: PIXI.WebGLRenderer | PIXI.CanvasRenderer;
  private container: PIXI.Container;
  private background: PIXI.Sprite;
  private width: number;
  private height: number;
  private label: PIXI.Text;
  private editIcon: EditIcon;
  private portWrappers: { [key: string]: PortWrapper } = {};
  private positionChangedListeners: Array<() => void> = [];
  private isSelected = false;

  constructor(
    data: VertexData,
    dragRegistry: DragRegistry,
    private registerPort: (vtx: VertexWrapper, portId: string, port: PortWrapper) => void,
    renderer: PIXI.WebGLRenderer | PIXI.CanvasRenderer,
  ) {
    this.renderer = renderer;
    this.width = VertexWrapper.defaultWidth;
    this.height = VertexWrapper.defaultHeight;

    this.container = new PIXI.Container();
    this.container.interactive = true;

    this.background = new PIXI.Sprite(); // placeholder
    this.container.addChild(this.background);
    this.redrawBackground();

    // this.sprite.buttonMode = true;
    // this.graphics.hitArea = new PIXI.Rectangle(data.geo.w, data.geo.h);

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

    this.label = new PIXI.Text("", textStyle);
    this.container.addChild(this.label);

    this.editIcon = new EditIcon(dragRegistry);
    this.editIcon.addTo(this.container);
    this.editIcon.addClickListener(() => {
      console.log("Edit icon clicked");
    });

    this.positionChildren();

    this.updateData(data);
  }

  public getDisplayObject() {
    return this.container;
  }

  public toggleSelected(selected: boolean): void {
    this.isSelected = selected;
    this.redrawBackground();
  }

  private redrawBackground(): void {
    this.container.removeChild(this.background);
    this.background = new PIXI.Sprite(this.renderer.generateTexture(
      VertexWrapper.generateBoxGraphics(1, this.isSelected),
      undefined, // scale mode
      this.renderer.resolution*4, // resolution
      undefined, // region
    ));
    this.container.addChildAt(this.background, 0); // insert behind other children
  }

  private positionChildren(): void {
    const padding = (this.container.height - this.editIcon.getHeight())/2;
    this.editIcon.setPosition(this.container.width - (this.editIcon.getWidth() + padding), padding);
    const widthForLabel = this.container.width - (this.editIcon.getWidth() + padding);

    this.label.x = (widthForLabel - this.label.width)/2;
    this.label.y = (this.container.height - this.label.height)/2;
  }

  public getPortWrapper(key: string): PortWrapper {
    const portWrapper = this.portWrappers[key];
    if (portWrapper === undefined) throw new Error(`Could not find port wrapper with key ${key}`);

    return portWrapper;
  }

  public portKeys(): string[] {
    return Object.keys(this.portWrappers);
  }

  public updateData(data: VertexData): void {
    this.setPosition(data.geo.x, data.geo.y);

    if (this.label.text !== data.label) {
      this.label.text = data.label;
      this.positionChildren();
    }

    const currentPortKeys = Object.keys(this.portWrappers);
    const dataPortKeys = Object.keys(data.ports);

    const removedPortKeys = currentPortKeys.filter(key => dataPortKeys.indexOf(key) === -1);
    const addedPortKeys = dataPortKeys.filter(key => currentPortKeys.indexOf(key) === -1);
    const sharedPortKeys = dataPortKeys.filter(key => currentPortKeys.indexOf(key) !== -1);

    for (const removedPortKey of removedPortKeys) {
      this.portWrappers[removedPortKey].removeFrom(this.container);
    }

    const portX = (portWrapper: PortWrapper, data: PortData) => {
      if (data.side === "top" || data.side === "bottom") {
        return this.width*data.position - portWrapper.getWidth()/2;
      } else if (data.side === "left") {
        return - portWrapper.getWidth()/2 + VertexWrapper.borderWidth/2;
      } else if (data.side === "right") {
        return this.width + VertexWrapper.borderWidth - portWrapper.getWidth()/2;
      } else {
        throw new Error(`Invalid side type ${data.side}`);
      }
    }
    const portY = (portWrapper: PortWrapper, data: PortData) => {
      if (data.side === "left" || data.side === "right") {
        return this.height*data.position - portWrapper.getHeight()/2;
      } else if (data.side === "top") {
        return - portWrapper.getHeight()/2 + VertexWrapper.borderWidth/2;
      } else if (data.side === "bottom") {
        return this.height + VertexWrapper.borderWidth - portWrapper.getHeight()/2;
      } else {
        throw new Error(`Invalid side type ${data.side}`);
      }
    }

    for (const addedPortKey of addedPortKeys) {
      const portData = data.ports[addedPortKey];
      const portWrapper = new PortWrapper(this.renderer, portData.portType === "output");
      portWrapper.addTo(this.container);

      this.registerPort(this, addedPortKey, portWrapper);
      this.portWrappers[addedPortKey] = portWrapper;

      portWrapper.setPosition(
        portX(portWrapper, portData),
        portY(portWrapper, portData),
      );
    }

    for (const sharedPortKey of sharedPortKeys) {
      const portData = data.ports[sharedPortKey];
      const portWrapper = this.portWrappers[sharedPortKey];

      portWrapper.setPosition(
        portX(portWrapper, portData),
        portY(portWrapper, portData),
      );
    }
  }

  public addTo(obj: PIXI.Container): void {
    obj.addChild(this.container);
  }

  public removeFrom(obj: PIXI.Container): void {
    obj.removeChild(this.container);
  }

  public addChild(obj: PIXI.DisplayObject): void {
    this.container.addChild(obj);
  }

  public removeChild(obj: PIXI.DisplayObject): void {
    this.container.removeChild(obj);
  }

  public addPositionChangedListener(listener: () => void): void {
    this.positionChangedListeners.push(listener);;
  }

  public setPosition(x: number, y: number): void {
    if (this.container.position.x !== x || this.container.position.y !== y) {
      this.container.position.set(x, y);
      for (const listener of this.positionChangedListeners) {
        listener();
      }
    }
  }

  public localX(): number {
    return this.container.position.x;
  }

  public localY(): number {
    return this.container.position.y;
  }

  public getWidth(): number {
    return this.width;
  }

  public getHeight(): number {
    return this.height;
  }

  public on(ev: string, fn: Function, context?: any): this {
    this.container.on(ev, fn, context);
    return this;
  }

  public getDataRelativeLoc(data: PIXI.interaction.InteractionData): PIXI.Point {
    return data.getLocalPosition(this.container);
  }
}
