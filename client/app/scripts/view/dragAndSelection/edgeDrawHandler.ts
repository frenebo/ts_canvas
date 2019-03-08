import { PortWrapper } from "../graphicWrappers/portWrapper.js";
import { VertexWrapper } from "../graphicWrappers/vertexWrapper.js";
import { StageInterface } from "../stageInterface.js";

/** Class for keeping track of an edge creation preview */
export class EdgeDrawHandler {
  private dragData: {
    sourceVtx: VertexWrapper;
    sourcePort: PortWrapper;
    graphics: PIXI.Graphics;
  } | null = null;

  /**
   * Constructs an edge draw handler.
   * @param stageInterface - The stage interface to use for the drawing
   */
  constructor(
    private readonly stageInterface: StageInterface,
  ) {
  }

  /**
   * Begins to draw the edge.
   * @param sourceVertex - The vertex the edge starts at
   * @param sourcePort - The port the edge starts at
   */
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

  /**
   * Redraws the edge preview with the new end coordinates and validity value
   * @param endX - The new end X coordinate of the edge
   * @param endY - The new end Y coordinate of the edge
   * @param validity - The optional validity value of the edge. No value provided means valid
   */
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

  /**
   * Ends and destroys the drag preview.
   */
  public endDrag(): void {
    if (this.dragData === null) {
      throw new Error("Not currently drawing edge");
    }

    this.stageInterface.removeDisplayObject(this.dragData.graphics);
    this.dragData = null;
  }
}
