import { StageInterface } from "../stageInterface.js";
import { EditIconWrapper } from "./editIconWrapper.js";
import { GraphicWrapper } from "./graphicWrapper.js";
import { LabelWrapper } from "./labelWrapper.js";
import { PortWrapper } from "./portWrapper.js";
import { VtxBackgroundWrapper } from "./vertexBackgroundWrapper.js";

/** Class for wrapping a vertex's PIXI graphics */
export class VertexWrapper extends GraphicWrapper {
  public static readonly width = 400;
  public static readonly height = 80;

  private editIcon: EditIconWrapper | null = null;
  private isSelected = false;
  private readonly label: LabelWrapper;
  private readonly background: VtxBackgroundWrapper;

  /**
   * Constructs a graphic wrapper.
   * @param stageInterface - The stage interface
   */
  constructor(stageInterface: StageInterface) {
    super();
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

  /**
   * Adds an edit icon to this vertex wrapper.
   * @param editIcon - The edit icon wrapper to add
   */
  public addEditIcon(editIcon: EditIconWrapper): void {
    this.editIcon = editIcon;
    this.addChild(this.editIcon);
    this.editIcon.addClickListener(() => {
      console.log("Edit icon clicked");
    });
    this.positionChildren();
  }

  /**
   * Toggles whether this vertex is selected or not.
   * @param selected - Whether the vertex should be selected
   */
  public toggleSelected(selected: boolean): void {
    if (this.isSelected != selected) {
      this.isSelected = selected;
      this.redrawBackground();
    }
  }

  /**
   * Positions a port that has already been added to this vertex wrapper.
   * @param portWrapper - The port wrapper
   * @param position - The new position along the vertex's side
   * @param side - Which side the port goes on: "top", "bottom", "left" or "right"
   */
  public positionPort(portWrapper: PortWrapper, position: number, side: "top" | "bottom" | "left" | "right"): void {
    let portX: number;
    let portY: number;
    if (side === "top" || side === "bottom") {
      portX = VertexWrapper.width * position - PortWrapper.width / 2;
    } else if (side === "left") {
      portX = - PortWrapper.width / 2;
    } else if (side === "right") {
      portX = VertexWrapper.width - PortWrapper.width / 2;
    } else {
      throw new Error(`Invalid side type ${side}`);
    }

    if (side === "left" || side === "right") {
      portY = VertexWrapper.height * position - PortWrapper.height / 2;
    } else if (side === "top") {
      portY = - PortWrapper.height / 2;
    } else if (side === "bottom") {
      portY = VertexWrapper.height - PortWrapper.height / 2;
    } else {
      throw new Error(`Invalid side type ${side}`);
    }

    portWrapper.setLocalPosition(portX, portY);
  }

  /**
   * Sets the label text of this vertex wrapper.
   * @param text - The new label text
   */
  public setLabelText(text: string): void {
    this.label.setText(text);
    this.positionChildren();
  }

  /**
   * Redraws this vertex's wrapper's background.
   */
  private redrawBackground(): void {
    this.background.redraw(
      this.isSelected,
      VertexWrapper.width,
      VertexWrapper.height,
      1,
    );
  }

  /**
   * Positions the children of this vertex wrapper.s
   */
  private positionChildren(): void {
    let widthForLabel: number;
    if (this.editIcon !== null) {
      const editIconPadding = (VertexWrapper.height - EditIconWrapper.height) / 2;
      widthForLabel = VertexWrapper.width - EditIconWrapper.width - editIconPadding;
      this.editIcon.setLocalPosition(
        widthForLabel,
        editIconPadding,
      );
    } else {
      widthForLabel = VertexWrapper.width;
    }

    this.label.setLocalPosition(
      (widthForLabel - this.label.getWidth()) / 2,
      (VertexWrapper.height - this.label.getHeight()) / 2,
    );
  }
}
