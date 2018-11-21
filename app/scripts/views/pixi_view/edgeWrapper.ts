import { PortWrapper } from "./portWrapper.js";
import { VertexWrapper } from "./vertexWrapper.js";
import { DragRegistry } from "./dragAndSelection/dragRegistry.js";

export class EdgeWrapper {
  private static spriteLeftRightPadding = 25;
  private static spriteTopBottomPadding = 25;
  private static lineWidth = 10;
  private static unselectedLineColor = 0x000000;
  private static selectedLineColor = 0xFFFF00;


  private static drawSprite(
    sourceX: number,
    sourceY: number,
    targetX: number,
    targetY: number,
    selected: boolean,
    renderer: PIXI.WebGLRenderer | PIXI.CanvasRenderer,
  ): PIXI.Sprite {
    const graphics = new PIXI.Graphics();
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

    const sprite = new PIXI.Sprite(renderer.generateTexture(
      graphics,
      undefined, // scale mode
      renderer.resolution*4,
      new PIXI.Rectangle(
        0,
        0,
        graphics.width + EdgeWrapper.spriteLeftRightPadding,
        graphics.height + EdgeWrapper.spriteTopBottomPadding,
      ), // region
    ));
    sprite.cacheAsBitmap = true;

    return sprite;
  }

  private container: PIXI.Container;
  private sprite: PIXI.Sprite;
  private isSelected = false;

  constructor(
    private sourceVertex: VertexWrapper,
    private sourcePort: PortWrapper,
    private targetVertex: VertexWrapper,
    private targetPort: PortWrapper,
    private renderer: PIXI.WebGLRenderer | PIXI.CanvasRenderer,
    dragRegistry: DragRegistry,
  ) {
    this.container = new PIXI.Container();
    this.container.interactive = true;
    // this.container.buttonMode = true;

    this.sprite = new PIXI.Sprite();

    this.refresh();
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

  public refresh(): void {
    const sourceX = this.sourcePort.localX() + this.sourceVertex.localX() + this.sourcePort.getWidth()/2;
    const sourceY = this.sourcePort.localY() + this.sourceVertex.localY() + this.sourcePort.getHeight()/2;
    const targetX = this.targetPort.localX() + this.targetVertex.localX() + this.targetPort.getWidth()/2;
    const targetY = this.targetPort.localY() + this.targetVertex.localY() + this.targetPort.getHeight()/2;

    if (
      sourceX === this.previousSourceX &&
      sourceY === this.previousSourceY &&
      targetX === this.previousTargetX &&
      targetY === this.previousTargetY
    ) {
      // if the line has not changed at all, do nothing
      return;
    }

    // Don't redraw if the line has not changed
    if (
      targetY - sourceY === this.previousTargetY - this.previousSourceY &&
      targetX - sourceX === this.previousTargetX - this.previousSourceX
    ) {
      // skip redraw
    } else {
      this.container.removeChild(this.sprite);
      this.sprite = EdgeWrapper.drawSprite(
        sourceX,
        sourceY,
        targetX,
        targetY,
        this.isSelected,
        this.renderer,
      );
      this.container.addChild(this.sprite);
    }
    this.previousSourceX = sourceX;
    this.previousSourceY = sourceY;
    this.previousTargetX = targetX;
    this.previousTargetY = targetY;

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

    this.container.position.set(
      Math.min(sourceX, targetX) - EdgeWrapper.spriteLeftRightPadding,
      Math.min(sourceY, targetY) - EdgeWrapper.spriteTopBottomPadding,
    );
  }
}
