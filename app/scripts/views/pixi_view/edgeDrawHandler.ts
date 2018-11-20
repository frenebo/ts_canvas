import { PortWrapper } from "./portWrapper";
import { VertexWrapper } from "./vertexWrapper";
import { BackgroundWrapper } from "./backgroundWrapper";

export class EdgeDrawHandler {
  private backgroundWrapper: BackgroundWrapper;
  private dragData: {
    sourceVtx: VertexWrapper,
    sourcePort: PortWrapper,
    graphics: PIXI.Graphics;
  } | null = null;
  constructor(backgroundWrapper: BackgroundWrapper) {
    this.backgroundWrapper = backgroundWrapper;
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

  public updateLineEnd(cursorLocalX: number, cursorLocalY: number): void {
    if (this.dragData === null) throw new Error("Not currently drawing edge");

    const startX = this.dragData.sourcePort.localX() + this.dragData.sourcePort.getWidth()/2 + this.dragData.sourceVtx.localX();
    const startY = this.dragData.sourcePort.localY() + this.dragData.sourcePort.getHeight()/2 + this.dragData.sourceVtx.localY();

    this.dragData.graphics.clear();
    this.dragData.graphics.lineColor = 0x000000;
    this.dragData.graphics.lineWidth = 10;
    // this.dragData.graphics.position.set(startX, startY);
    this.dragData.graphics.moveTo(startX, startY);
    this.dragData.graphics.lineTo(cursorLocalX, cursorLocalY);
  }

  public endDrag(): void {
    if (this.dragData == null) throw new Error("Not currently drawing edge");

    this.backgroundWrapper.removeChild(this.dragData.graphics);
    this.dragData = null;
  }
}
