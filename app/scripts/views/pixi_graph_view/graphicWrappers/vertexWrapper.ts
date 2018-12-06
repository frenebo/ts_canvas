// import { VertexData, PortData } from "../../interfaces.js";
import { EditIconWrapper } from "./editIconWrapper.js";
import { PortWrapper } from "./portWrapper.js";
import { GraphicWrapper } from "./graphicsWrapper.js";

export class VertexWrapper extends GraphicWrapper {
  private static readonly unselectedFillColor = 0xE6E6E6;
  private static readonly selectedFillColor = 0xFFFF00;
  private static readonly borderColor = 0x333333;
  private static readonly borderWidth = 5;
  private static readonly defaultWidth = 250;
  private static readonly defaultHeight = 80;

  private static readonly cachedTextures = new Map<string, PIXI.RenderTexture>();
  public static generateBoxTexture(
    alpha: number,
    selected: boolean,
    renderer: PIXI.WebGLRenderer | PIXI.CanvasRenderer,
  ): PIXI.RenderTexture {
    const uniqueTextureString = alpha.toString() + selected.toString();
    if (VertexWrapper.cachedTextures.has(uniqueTextureString)) {
      return VertexWrapper.cachedTextures.get(uniqueTextureString)!;
    } else {

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

      const texture = renderer.generateTexture(
        graphics,
        undefined, // scale mode
        renderer.resolution*4, // resolution
        undefined, // region
      );
      VertexWrapper.cachedTextures.set(uniqueTextureString, texture);

      return texture;
    }
  }

  private readonly renderer: PIXI.WebGLRenderer | PIXI.CanvasRenderer;
  private readonly width: number;
  private readonly height: number;
  private readonly label: PIXI.Text;
  private editIcon: EditIconWrapper | null = null;
  private isSelected = false;
  private background: PIXI.Sprite;

  constructor(
    // private readonly registerPort: (vtx: VertexWrapper, portId: string, port: PortWrapper) => void,
    renderer: PIXI.WebGLRenderer | PIXI.CanvasRenderer,
  ) {
    super({});
    this.renderer = renderer;
    this.width = VertexWrapper.defaultWidth;
    this.height = VertexWrapper.defaultHeight;

    this.background = new PIXI.Sprite(); // placeholder
    this.addChild(this.background);
    this.redrawBackground();

    // this.sprite.buttonMode = true;
    // this.graphics.hitArea = new PIXI.Rectangle(data.geo.w, data.geo.h);

    const textStyle = new PIXI.TextStyle({
      fontFamily: "Arial",
      fontSize: 30,
      // fontStyle: 'italic',
      // fontWeight: "bold",
      // fill: "#ffffff",
      // stroke: "#4a1850",
      // strokeThickness: 5,
      // dropShadow: true,
      // dropShadowColor: "#000000",
      // dropShadowBlur: 4,
      // dropShadowAngle: Math.PI / 6,
      // dropShadowDistance: 6,
      // wordWrap: true,
      // wordWrapWidth: 440,
    });

    this.label = new PIXI.Text("", textStyle);
    this.addChild(this.label);


    // this.positionChildren();
  }

  public addEditIcon(editIcon: EditIconWrapper): void {
    this.editIcon = editIcon;
    this.addChild(this.editIcon);
    this.editIcon.addClickListener(() => {
      console.log("Edit icon clicked");
    });
    this.positionChildren();
  }

  public toggleSelected(selected: boolean): void {
    this.isSelected = selected;
    this.redrawBackground();
  }

  private redrawBackground(): void {
    this.removeChild(this.background);
    this.background = new PIXI.Sprite(VertexWrapper.generateBoxTexture(1, this.isSelected, this.renderer));
    this.addChildAt(this.background, 0); // insert behind other children
  }

  private positionChildren(): void {
    let widthForLabel: number;
    if (this.editIcon !== null) {
      const padding = (this.getBackgroundHeight() - this.editIcon.getBackgroundHeight())/2;
      this.editIcon.setPosition(this.getBackgroundWidth() - (this.editIcon.getBackgroundWidth() + padding), padding);
      widthForLabel = this.getBackgroundWidth() - (this.editIcon.getBackgroundWidth() + padding);
    } else {
      widthForLabel = this.getBackgroundWidth();
    }

    this.label.position.set(
      (widthForLabel - this.label.width)/2,
      this.label.y = (this.getBackgroundHeight() - this.label.height)/2,
    );
  }

  public positionPort(portWrapper: PortWrapper, position: number, side: "top" | "bottom" | "left" | "right"): void {
    let portX: number;
    let portY: number;
    if (side === "top" || side === "bottom") {
      portX = this.width*position - portWrapper.getBackgroundWidth()/2;
    } else if (side === "left") {
      portX = - portWrapper.getBackgroundWidth()/2 + VertexWrapper.borderWidth/2;
    } else if (side === "right") {
      portX = this.width + VertexWrapper.borderWidth - portWrapper.getBackgroundWidth()/2;
    } else {
      throw new Error(`Invalid side type ${side}`);
    }

    if (side === "left" || side === "right") {
      portY = this.height*position - portWrapper.getBackgroundHeight()/2;
    } else if (side === "top") {
      portY = - portWrapper.getBackgroundHeight()/2 + VertexWrapper.borderWidth/2;
    } else if (side === "bottom") {
      portY = this.height + VertexWrapper.borderWidth - portWrapper.getBackgroundHeight()/2;
    } else {
      throw new Error(`Invalid side type ${side}`);
    }

    portWrapper.setPosition(portX, portY);
  }

  public setLabelText(text: string): void {
    if (this.label.text !== text) {
      this.label.text = text;
      this.positionChildren();
    }
  }
}