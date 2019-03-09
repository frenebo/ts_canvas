import { GraphicWrapper } from "./graphicWrapper.js";
import { PortWrapper } from "./portWrapper.js";
import { VertexWrapper } from "./vertexWrapper.js";

/** Class for containing a graph edge's PIXI graphic */
export class EdgeWrapper extends GraphicWrapper {
  private static readonly spriteLeftRightPadding = 25;
  private static readonly spriteTopBottomPadding = 25;
  private static readonly lineWidth = 10;
  private static readonly unselectedLineColor = 0x000000;
  private static readonly selectedLineColor = 0xFFFF00;
  private static readonly inconsistentLineColor = 0xCC0000;

  /**
   * Redraws a PIXI edge graphic to the given specifications
   * @param graphics - The PIXI graphic to redraw
   * @param sourceX - The source X position of the edge
   * @param sourceY - The source Y position of the edge
   * @param targetX - The target X position of the edge
   * @param targetY - The target Y position of the edge
   * @param selected - Whether or not the edge is selected
   * @param consistent - Whether or not the edge is consistent, whether source and target values agree
   */
  private static draw(
    graphics: PIXI.Graphics,
    sourceX: number,
    sourceY: number,
    targetX: number,
    targetY: number,
    selected: boolean,
    consistent: "consistent" | "inconsistent", // @TODO implement
  ): void {
    graphics.clear();
    let lineColor: number;
    if (selected) {
      lineColor = EdgeWrapper.selectedLineColor;
    } else {
      if (consistent === "consistent") {
        lineColor = EdgeWrapper.unselectedLineColor;
      } else {
        lineColor = EdgeWrapper.inconsistentLineColor;
      }
    }
    graphics.lineStyle(EdgeWrapper.lineWidth, lineColor);

    const topLeftX = Math.min(sourceX, targetX);
    const topLeftY = Math.min(sourceY, targetY);

    graphics.moveTo(
      (sourceX - topLeftX) + EdgeWrapper.spriteLeftRightPadding,
      (sourceY - topLeftY) + EdgeWrapper.spriteTopBottomPadding,
    );
    graphics.lineTo(
      (targetX - topLeftX) + EdgeWrapper.spriteLeftRightPadding,
      (targetY - topLeftY) + EdgeWrapper.spriteTopBottomPadding,
    );
  }

  private readonly graphics: PIXI.Graphics;
  private isSelected = false;
  private previousSourceX = 0;
  private previousTargetX = 0;
  private previousSourceY = 0;
  private previousTargetY = 0;
  private previousIsSelected = false;

  /**
   * Constructs an edge wrapper.
   * @param sourceVertex - The source vertex wrapper
   * @param sourcePort - The source port wrapper
   * @param targetVertex - The target vertex wrapper
   * @param targetPort - The target port wrapper
   * @param consistency - Whether or not the edge is consistent, whether source and target values agree
   */
  constructor(
    private readonly sourceVertex: VertexWrapper,
    private readonly sourcePort: PortWrapper,
    private readonly targetVertex: VertexWrapper,
    private readonly targetPort: PortWrapper,
    private readonly consistency: "consistent" | "inconsistent",
  ) {
    super();

    this.graphics = new PIXI.Graphics();
    this.addChild(this.graphics);

    this.refresh(true);
  }

  /**
   * Sets whether or not the edge is selected.
   * @param selected - Whether or not the edge should be selected
   */
  public toggleSelected(selected: boolean): void {
    this.isSelected = selected;
    this.refresh();
  }

  /**
   * Decides whether the edge has changed, then redraws it if it has.
   * @param force - Tells refresh to redraws the edge regardless of whether it has changed
   */
  public refresh(force = false): void {
    const sourceX = this.sourcePort.localX() + this.sourceVertex.localX() + PortWrapper.width / 2;
    const sourceY = this.sourcePort.localY() + this.sourceVertex.localY() + PortWrapper.height / 2;
    const targetX = this.targetPort.localX() + this.targetVertex.localX() + PortWrapper.width / 2;
    const targetY = this.targetPort.localY() + this.targetVertex.localY() + PortWrapper.height / 2;

    if (
      !force &&
      sourceX === this.previousSourceX &&
      sourceY === this.previousSourceY &&
      targetX === this.previousTargetX &&
      targetY === this.previousTargetY &&
      this.isSelected === this.previousIsSelected
    ) {
      // if the line has not changed at all, do nothing
      return;
    }

    // Don't redraw if the line dimensions have not changed - just move it
    if (
      !force &&
      targetY - sourceY === this.previousTargetY - this.previousSourceY &&
      targetX - sourceX === this.previousTargetX - this.previousSourceX &&
      this.isSelected === this.previousIsSelected
    ) {
      // skip redraw
    } else {
      EdgeWrapper.draw(
        this.graphics,
        sourceX,
        sourceY,
        targetX,
        targetY,
        this.isSelected,
        this.consistency,
      );
    }

    this.previousSourceX = sourceX;
    this.previousSourceY = sourceY;
    this.previousTargetX = targetX;
    this.previousTargetY = targetY;
    this.previousIsSelected = this.isSelected;
    this.setLocalPosition(
      Math.min(sourceX, targetX) - EdgeWrapper.spriteLeftRightPadding,
      Math.min(sourceY, targetY) - EdgeWrapper.spriteTopBottomPadding,
    );

    const angle = Math.atan((targetY - sourceY) / (targetX - sourceX)) + (targetX < sourceX ? Math.PI : 0);
    const thicknessHorizontalOffset = Math.sin(angle) * EdgeWrapper.lineWidth / 2;
    const thicknessVerticalOffset = Math.cos(angle) * EdgeWrapper.lineWidth / 2;

    this.updateHitArea(new PIXI.Polygon(
      new PIXI.Point(
        sourceX - this.localX() + thicknessHorizontalOffset,
        sourceY - this.localY() - thicknessVerticalOffset,
      ),
      new PIXI.Point(
        sourceX - this.localX() - thicknessHorizontalOffset,
        sourceY - this.localY() + thicknessVerticalOffset,
      ),
      new PIXI.Point(
        targetX - this.localX() - thicknessHorizontalOffset,
        targetY - this.localY() + thicknessVerticalOffset,
      ),
      new PIXI.Point(
        targetX - this.localX() + thicknessHorizontalOffset,
        targetY - this.localY() - thicknessVerticalOffset,
      ),
    ));
  }
}
