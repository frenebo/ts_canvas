import { PortWrapper } from "../graphicWrappers/portWrapper.js";
import { VertexWrapper } from "../graphicWrappers/vertexWrapper.js";
import { StageInterface } from "../stageInterface.js";

export class EdgeDrawHandler {
  private dragData: {
    sourceVtx: VertexWrapper;
    sourcePort: PortWrapper;
    graphics: PIXI.Graphics;
  } | null = null;

  constructor(
    private readonly stageInterface: StageInterface,
  ) {
  }

  public beginDraw(sourceVertex: VertexWrapper, sourcePort: PortWrapper): void {
    if (this.dragData !== null) {
      throw new Error("Already drawing edge");
    }

    const graphics = new PIXI.Graphics();
    this.stageInterface.addDisplayObject(graphics);

    graphics.lineColor = 0x000000;
    graphics.lineStyle(10);

    this.dragData = {
      graphics: graphics,
      sourcePort: sourcePort,
      sourceVtx: sourceVertex,
    };
  }

  public redrawLine(endX: number, endY: number, validity?: "valid" | "invalid" | undefined | null): void {
    if (this.dragData === null) {
      throw new Error("Not currently drawing edge");
    }

    const startX =
      this.dragData.sourcePort.localX() + PortWrapper.width / 2 + this.dragData.sourceVtx.localX();
    const startY =
      this.dragData.sourcePort.localY() + PortWrapper.height / 2 + this.dragData.sourceVtx.localY();

    this.dragData.graphics.clear();

    let lineColor: number;

    if (validity === undefined || validity === null) {
      lineColor = 0x444444;
    } else if (validity === "valid") {
      lineColor = 0x009933;
    } else if (validity === "invalid") {
      lineColor = 0xCC0000;
    } else {
      throw new Error(`Unknown validity value ${validity}`);
    }

    this.dragData.graphics.lineStyle(10, lineColor);
    this.dragData.graphics.moveTo(startX, startY);
    this.dragData.graphics.lineTo(endX, endY);
  }

  public endDrag(): void {
    if (this.dragData === null) {
      throw new Error("Not currently drawing edge");
    }

    this.stageInterface.removeDisplayObject(this.dragData.graphics);
    this.dragData = null;
  }
}