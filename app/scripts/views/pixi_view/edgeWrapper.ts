import { PortWrapper } from "./portWrapper.js";
import { VertexWrapper } from "./vertexWrapper.js";
import { DragRegistry } from "./dragAndSelection/dragRegistry.js";

export class EdgeWrapper {
  private static spriteLeftRightPadding = 25;
  private static spriteTopBottomPadding = 25;
  private static lineWidth = 10;
  private static unselectedLineColor = 0x000000;
  private static selectedLineColor = 0xFFFF00;


  private static draw(
    graphics: PIXI.Graphics,
    sourceX: number,
    sourceY: number,
    targetX: number,
    targetY: number,
    selected: boolean,
  ): PIXI.Graphics {
    // graphics.cacheAsBitmap = false;
    graphics.clear();
    graphics.lineColor = selected ? EdgeWrapper.selectedLineColor : EdgeWrapper.unselectedLineColor;
    graphics.lineWidth = EdgeWrapper.lineWidth;

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
    // graphics.cacheAsBitmap = true;
    return graphics;
  }

  private container: PIXI.Container;
  private graphics: PIXI.Graphics;
  private isSelected = false;

  constructor(
    private sourceVertex: VertexWrapper,
    private sourcePort: PortWrapper,
    private targetVertex: VertexWrapper,
    private targetPort: PortWrapper,
    private renderer: PIXI.WebGLRenderer | PIXI.CanvasRenderer,
  ) {
    this.container = new PIXI.Container();
    this.container.interactive = true;

    this.graphics = new PIXI.Graphics();
    this.container.addChild(this.graphics);

    this.refresh();
  }

  public getDataRelativeLoc(data: PIXI.interaction.InteractionData) {
    return data.getLocalPosition(this.container);
  }

  public localX(): number {
    return this.container.position.x;
  }

  public localY(): number {
    return this.container.position.y;
  }

  public getDisplayObject() {
    return this.container;
  }

  public toggleSelected(selected: boolean): void {
    this.isSelected = selected;
    this.refresh();
  }

  public addTo(obj: PIXI.Container): void {
    obj.addChild(this.container);
  }

  public removeFrom(obj: PIXI.Container): void {
    obj.removeChild(this.container);
  }

  private previousSourceX = 0;
  private previousTargetX = 0;
  private previousSourceY = 0;
  private previousTargetY = 0;
  private previousIsSelected = false;

  public refresh(): void {
    const sourceX = this.sourcePort.localX() + this.sourceVertex.localX() + this.sourcePort.getWidth()/2;
    const sourceY = this.sourcePort.localY() + this.sourceVertex.localY() + this.sourcePort.getHeight()/2;
    const targetX = this.targetPort.localX() + this.targetVertex.localX() + this.targetPort.getWidth()/2;
    const targetY = this.targetPort.localY() + this.targetVertex.localY() + this.targetPort.getHeight()/2;

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
      console.log("drawing again")
      EdgeWrapper.draw(
        this.graphics,
        sourceX,
        sourceY,
        targetX,
        targetY,
        this.isSelected,
      );
    }
    this.previousSourceX = sourceX;
    this.previousSourceY = sourceY;
    this.previousTargetX = targetX;
    this.previousTargetY = targetY;
    this.previousIsSelected = this.isSelected;

    this.container.position.set(
      Math.min(sourceX, targetX) - EdgeWrapper.spriteLeftRightPadding,
      Math.min(sourceY, targetY) - EdgeWrapper.spriteTopBottomPadding,
    );

    const angle = Math.atan((targetY - sourceY)/(targetX - sourceX)) + (targetX < sourceX ? Math.PI : 0);
    const thicknessHorizontalOffset = Math.sin(angle)*EdgeWrapper.lineWidth/2;
    const thicknessVerticalOffset = Math.cos(angle)*EdgeWrapper.lineWidth/2;

    this.container.hitArea = new PIXI.Polygon(
      new PIXI.Point(
        sourceX - this.container.position.x + thicknessHorizontalOffset,
        sourceY - this.container.position.y - thicknessVerticalOffset,
      ),
      new PIXI.Point(
        sourceX - this.container.position.x - thicknessHorizontalOffset,
        sourceY - this.container.position.y + thicknessVerticalOffset,
      ),
      new PIXI.Point(
        targetX - this.container.position.x - thicknessHorizontalOffset,
        targetY - this.container.position.y + thicknessVerticalOffset,
      ),
      new PIXI.Point(
        targetX - this.container.position.x + thicknessHorizontalOffset,
        targetY - this.container.position.y - thicknessVerticalOffset,
      ),
    );
  }
}
