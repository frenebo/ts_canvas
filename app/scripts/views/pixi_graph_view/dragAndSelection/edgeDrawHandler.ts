import { PortWrapper } from "../graphicWrappers/portWrapper.js";
import { VertexWrapper } from "../graphicWrappers/vertexWrapper.js";
import { BackgroundWrapper } from "../backgroundWrapper.js";

export class EdgeDrawHandler {
  private dragData: {
    sourceVtx: VertexWrapper;
    sourcePort: PortWrapper;
    graphics: PIXI.Graphics;
  } | null = null;

  constructor(
    private readonly backgroundWrapper: BackgroundWrapper,
  ) {
  }

  public beginDraw(sourceVertex: VertexWrapper, sourcePort: PortWrapper): void {
    if (this.dragData !== null) throw new Error("Already drawing edge");

    const graphics = new PIXI.Graphics();
    this.backgroundWrapper.addChild(graphics);

    graphics.lineColor = 0x000000;
    graphics.lineWidth = 10;

    this.dragData = {
      sourceVtx: sourceVertex,
      sourcePort: sourcePort,
      graphics: graphics,
    };
  }

  public redrawLine(endX: number, endY: number, validity?: "valid" | "invalid" | undefined | null): void {
    if (this.dragData === null) throw new Error("Not currently drawing edge");

    const startX =
      this.dragData.sourcePort.localX() + this.dragData.sourcePort.getBackgroundWidth()/2 + this.dragData.sourceVtx.localX();
    const startY =
      this.dragData.sourcePort.localY() + this.dragData.sourcePort.getBackgroundHeight()/2 + this.dragData.sourceVtx.localY();

    this.dragData.graphics.clear();

    if (validity === undefined || validity === null) this.dragData.graphics.lineColor = 0x444444;
    else if (validity === "valid") this.dragData.graphics.lineColor = 0x009933;
    else if (validity === "invalid") this.dragData.graphics.lineColor = 0xCC0000;
    else throw new Error(`Unknown validity value ${validity}`);

    this.dragData.graphics.lineWidth = 10;
    // this.dragData.graphics.position.set(startX, startY);
    this.dragData.graphics.moveTo(startX, startY);
    this.dragData.graphics.lineTo(endX, endY);
  }

  public endDrag(): void {
    if (this.dragData === null) throw new Error("Not currently drawing edge");

    this.backgroundWrapper.removeChild(this.dragData.graphics);
    this.dragData = null;
  }
}
