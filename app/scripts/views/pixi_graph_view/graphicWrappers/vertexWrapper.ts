// import { VertexData, PortData } from "../../interfaces.js";
import { EditIconWrapper } from "./editIconWrapper.js";
import { PortWrapper } from "./portWrapper.js";
import { GraphicWrapper } from "./graphicWrapper.js";
import { LabelWrapper } from "./labelWrapper.js";
import { VtxBackgroundWrapper } from "./vertexBackgroundWrapper.js";
import { StageInterface } from "../stageInterface.js";

export class VertexWrapper extends GraphicWrapper {
  public static readonly width = 250;
  public static readonly height = 80;

  private editIcon: EditIconWrapper | null = null;
  private isSelected = false;
  private readonly label: LabelWrapper;
  private readonly background: VtxBackgroundWrapper;

  constructor(stageInterface: StageInterface) {
    super({});
    this.background = new VtxBackgroundWrapper(stageInterface);
    this.addChild(this.background);
    this.redrawBackground();

    const textStyle = new PIXI.TextStyle({
      fontFamily: "Arial",
      fontSize: 30,
    });

    this.label = new LabelWrapper(stageInterface);
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
    this.background.redraw(
      this.isSelected,
      VertexWrapper.width,
      VertexWrapper.height,
      1,
    );
  }

  private positionChildren(): void {
    let widthForLabel: number;
    if (this.editIcon !== null) {
      const editIconPadding = (VertexWrapper.height - EditIconWrapper.height)/2;
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
