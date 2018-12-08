// import { VertexData, PortData } from "../../interfaces.js";
import { EditIconWrapper } from "./editIconWrapper.js";
import { PortWrapper } from "./portWrapper.js";
import { GraphicWrapper } from "./graphicWrapper.js";
import { LabelWrapper } from "./labelWrapper.js";

export class VertexWrapper extends GraphicWrapper {
  public static readonly width = 250;
  public static readonly height = 80;
  public static readonly backgroundSpritePadding = 5;

  private static readonly unselectedFillColor = 0xE6E6E6;
  private static readonly selectedFillColor = 0xFFFF00;
  private static readonly borderColor = 0x333333;
  private static readonly borderWidth = 5;

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
        VertexWrapper.backgroundSpritePadding,
        VertexWrapper.backgroundSpritePadding,
        VertexWrapper.width + VertexWrapper.backgroundSpritePadding,
        VertexWrapper.height + VertexWrapper.backgroundSpritePadding,
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
  private editIcon: EditIconWrapper | null = null;
  private isSelected = false;
  private background: PIXI.Sprite;
  private label: LabelWrapper;

  constructor(
    // private readonly registerPort: (vtx: VertexWrapper, portId: string, port: PortWrapper) => void,
    renderer: PIXI.WebGLRenderer | PIXI.CanvasRenderer,
  ) {
    super({});
    this.renderer = renderer;
    this.background = new PIXI.Sprite(); // placeholder
    this.addChild(this.background);
    this.redrawBackground();

    const textStyle = new PIXI.TextStyle({
      fontFamily: "Arial",
      fontSize: 30,
    });

    this.label = new LabelWrapper(renderer);
    this.addChild(this.label);
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
    this.background.position.set(-VertexWrapper.backgroundSpritePadding);
    this.addChildAt(this.background, 0); // insert behind other children
  }

  private positionChildren(): void {
    let widthForLabel: number;
    if (this.editIcon !== null) {
      const editIconPadding = (VertexWrapper.height - EditIconWrapper.height)/2
      widthForLabel = VertexWrapper.width - EditIconWrapper.width - editIconPadding;
      this.editIcon.setPosition(
        widthForLabel,
        editIconPadding,
      );
    } else {
      widthForLabel = VertexWrapper.width;
    }

    this.label.setPosition(
      (widthForLabel - this.label.getWidth())/2,
      (VertexWrapper.height - this.label.getHeight())/2,
    );
  }

  public positionPort(portWrapper: PortWrapper, position: number, side: "top" | "bottom" | "left" | "right"): void {
    let portX: number;
    let portY: number;
    if (side === "top" || side === "bottom") {
      portX = VertexWrapper.width*position - PortWrapper.width/2;
    } else if (side === "left") {
      portX = - PortWrapper.width/2;
    } else if (side === "right") {
      portX = VertexWrapper.width - PortWrapper.width/2;
    } else {
      throw new Error(`Invalid side type ${side}`);
    }

    if (side === "left" || side === "right") {
      portY = VertexWrapper.height*position - PortWrapper.height/2;
    } else if (side === "top") {
      portY = - PortWrapper.height/2;
    } else if (side === "bottom") {
      portY = VertexWrapper.height - PortWrapper.height/2;
    } else {
      throw new Error(`Invalid side type ${side}`);
    }

    portWrapper.setPosition(portX, portY);
  }

  public setLabelText(text: string): void {
    this.label.setText(text);
    this.positionChildren();
  }
}
