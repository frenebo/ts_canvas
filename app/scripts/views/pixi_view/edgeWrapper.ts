import { PortWrapper } from "./portWrapper";
import { VertexWrapper } from "./vertexWrapper";

export class EdgeWrapper {
  private static spriteLeftRightPadding = 10;
  private static spriteTopBottomPadding = 10;

  private static drawSprite(
    sourceX: number,
    sourceY: number,
    targetX: number,
    targetY: number,
    renderer: PIXI.WebGLRenderer | PIXI.CanvasRenderer,
  ): PIXI.Sprite {
    const graphics = new PIXI.Graphics();
    graphics.lineColor = 0x000000;
    graphics.lineWidth = 10;

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

    console.log("drew sprite");

    return sprite;
  }

  private container: PIXI.Container;
  private sprite: PIXI.Sprite;

  constructor(
    private sourceVertex: VertexWrapper,
    private sourcePort: PortWrapper,
    private targetVertex: VertexWrapper,
    private targetPort: PortWrapper,
    private renderer: PIXI.WebGLRenderer | PIXI.CanvasRenderer,
  ) {
    this.container = new PIXI.Container();
    this.sprite = new PIXI.Sprite();

    this.redraw();
    // this.container.addChild(this.sprite);

    sourcePort.addPositionChangedListener(() => this.redraw());
    sourceVertex.addPositionChangedListener(() => this.redraw());
    targetPort.addPositionChangedListener(() => this.redraw());
    targetVertex.addPositionChangedListener(() => this.redraw());
  }

  public addTo(obj: PIXI.Container): void {
    obj.addChild(this.container);
  }

  public removeFrom(obj: PIXI.Container): void {
    obj.removeChild(this.container);
  }

  private redraw(): void {
    const sourceX = this.sourcePort.localX() + this.sourceVertex.localX() + this.sourcePort.getWidth()/2;
    const sourceY = this.sourcePort.localY() + this.sourceVertex.localY() + this.sourcePort.getHeight()/2;
    const targetX = this.targetPort.localX() + this.targetVertex.localX() + this.targetPort.getWidth()/2;
    const targetY = this.targetPort.localY() + this.targetVertex.localY() + this.targetPort.getHeight()/2;

    this.container.removeChild(this.sprite);
    this.sprite = EdgeWrapper.drawSprite(
      sourceX,
      sourceY,
      targetX,
      targetY,
      this.renderer,
    );
    this.container.addChild(this.sprite);

    this.container.position.set(
      Math.min(sourceX, targetX) - EdgeWrapper.spriteLeftRightPadding,
      Math.min(sourceY, targetY) - EdgeWrapper.spriteTopBottomPadding,
    );
  }
}
