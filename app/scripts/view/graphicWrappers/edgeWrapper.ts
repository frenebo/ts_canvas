import { GraphicWrapper } from "./graphicWrapper.js";
import { PortWrapper } from "./portWrapper.js";
import { VertexWrapper } from "./vertexWrapper.js";

export class EdgeWrapper extends GraphicWrapper {
  private static readonly spriteLeftRightPadding = 25;
  private static readonly spriteTopBottomPadding = 25;
  private static readonly lineWidth = 10;
  private static readonly unselectedLineColor = 0x000000;
  private static readonly selectedLineColor = 0xFFFF00;
  private static readonly inconsistentLineColor = 0xCC0000;

  private static draw(
    graphics: PIXI.Graphics,
    sourceX: number,
    sourceY: number,
    targetX: number,
    targetY: number,
    selected: boolean,
    consistent: "consistent" | "inconsistent", // @TODO implement
  ): PIXI.Graphics {
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

    return graphics;
  }

  private readonly graphics: PIXI.Graphics;
  private isSelected = false;

  constructor(
    private readonly sourceVertex: VertexWrapper,
    private readonly sourcePort: PortWrapper,
    private readonly targetVertex: VertexWrapper,
    private readonly targetPort: PortWrapper,
    private readonly consistency: "consistent" | "inconsistent",
  ) {
    super({});

    this.graphics = new PIXI.Graphics();
    this.addChild(this.graphics);

    this.refresh();
  }

  public toggleSelected(selected: boolean): void {
    this.isSelected = selected;
    this.refresh();
  }

  private previousSourceX = 0;
  private previousTargetX = 0;
  private previousSourceY = 0;
  private previousTargetY = 0;
  private previousIsSelected = false;

  public refresh(): void {
    const sourceX = this.sourcePort.localX() + this.sourceVertex.localX() + PortWrapper.width / 2;
    const sourceY = this.sourcePort.localY() + this.sourceVertex.localY() + PortWrapper.height / 2;
    const targetX = this.targetPort.localX() + this.targetVertex.localX() + PortWrapper.width / 2;
    const targetY = this.targetPort.localY() + this.targetVertex.localY() + PortWrapper.height / 2;

    if (
      sourceX === this.previousSourceX &&
      sourceY === this.previousSourceY &&
      targetX === this.previousTargetX &&
      targetY === this.previousTargetY &&
      this.isSelected === this.previousIsSelected
    ) {
      // if the line has not changed at all, do nothing
      return;
    }

    // Don't redraw if the line has not changed
    if (
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
    this.setPosition(
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
