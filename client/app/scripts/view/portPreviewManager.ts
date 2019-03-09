import { PortWrapper } from "./graphicWrappers/portWrapper";
import { VertexWrapper } from "./graphicWrappers/vertexWrapper";
import { StageInterface } from "./stageInterface";

/** Class for managing port hover previews */
export class PortPreviewManager {
  private static readonly textPadding = 5;
  private static readonly cornerRadius = 3;

  private previewData: {
    port: PortWrapper;
    portId: string;
    vertexId: string;
    overlay: PIXI.Container;
  } | null = null;

  /**
   * Constructs a port preview manager.
   * @param stageInterface - The stage interface
   */
  constructor(
    private readonly stageInterface: StageInterface,
  ) {
    // empty
  }

  /**
   * Returns whether the given port is being previewed right now.
   * @param port - The port wrapper
   */
  public currentShowingIs(port: PortWrapper): boolean {
    return this.previewData !== null && this.previewData.port === port;
  }

  /**
   * Tells this port preview manager that a hover has begun over this port
   * @param port - The port wrapper
   * @param vertex - The vertex wrapper
   * @param portId - The id of the port
   * @param vertexId - The id of the vertex
   * @param showString - The string that a preview would show
   */
  public portHover(
    port: PortWrapper,
    vertex: VertexWrapper,
    portId: string,
    vertexId: string,
    showString: string,
  ): void {
    if (this.previewData !== null) {
      this.portHoverEnd(this.previewData.port);
    }

    this.previewData = {
      overlay: new PIXI.Container(),
      port: port,
      portId: portId,
      vertexId: vertexId,
    };

    this.stageInterface.addDisplayObject(this.previewData.overlay);
    this.previewData.overlay.scale.set(1 / this.stageInterface.getScale());

    const textBackground = new PIXI.Graphics();
    this.previewData.overlay.addChild(textBackground);

    const text = new PIXI.Text(showString);
    this.previewData.overlay.addChild(text);
    text.style = new PIXI.TextStyle({
      fill: "white",
      fontSize: 15,
    });
    text.position.set(PortPreviewManager.textPadding, PortPreviewManager.textPadding);

    const previewX = this.stageInterface.getMousePos().x;
    const previewY = this.stageInterface.getMousePos().y - this.previewData.overlay.height;

    this.previewData.overlay.position.set(previewX, previewY);

    const backgroundWidth = text.width + PortPreviewManager.textPadding * 2;
    const backgroundHeight = text.height + PortPreviewManager.textPadding * 2;

    textBackground.beginFill(0x333333);
    textBackground.drawRoundedRect(0, 0, backgroundWidth, backgroundHeight, PortPreviewManager.cornerRadius);

    this.stageInterface.onPositionOrZoomChanged(() => { this.portHoverEnd(port); });
  }

  /**
   * Tells this port preview manager that the hover over a given port has ended.
   * @param port - The port wrapper
   */
  public portHoverEnd(port: PortWrapper): void {
    if (this.previewData !== null && this.previewData.port === port) {
      this.stageInterface.removeDisplayObject(this.previewData.overlay);
      this.previewData = null;
    }
  }

  /**
   * Ends the port hover on a deleted port if this port is being hovered over.
   * @param portId - The port id
   * @param vertexId - The vertex id
   */
  public removePort(portId: string, vertexId: string): void {
    if (this.previewData !== null && this.previewData.portId === portId && this.previewData.vertexId === vertexId) {
      this.portHoverEnd(this.previewData.port);
    }
  }

  /**
   * Ends the port hover on any port on a deleted vertex if applicable.
   * @param vertexId - The id of the deleted vertex
   */
  public removeVertex(vertexId: string): void {
    if (this.previewData !== null && this.previewData.vertexId === vertexId) {
      this.portHoverEnd(this.previewData.port);
    }
  }
}
