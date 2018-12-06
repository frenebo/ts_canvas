import { PortWrapper } from "./graphicWrappers/portWrapper";
import { BackgroundWrapper } from "./backgroundWrapper";
import { VertexWrapper } from "./graphicWrappers/vertexWrapper";
import { ModelInfoRequestType, ModelInfoRequestMap, ModelInfoResponseMap } from "../../interfaces";

export class PortPreviewManager {
  private static textPadding = 5;
  private static cornerRadius = 3;

  private previewData: {
    port: PortWrapper;
    portId: string;
    vertexId: string;
    overlay: PIXI.Container;
  } | null = null;
  constructor(
    private readonly backgroundWrapper: BackgroundWrapper,
    private readonly sendModelInfoRequest: <T extends ModelInfoRequestType>(req: ModelInfoRequestMap[T]) => ModelInfoResponseMap[T],
  ) {

  }

  public currentShowingIs(port: PortWrapper): boolean {
    return this.previewData !== null && this.previewData.port === port;
  }

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
      port: port,
      portId: portId,
      vertexId: vertexId,
      overlay: new PIXI.Container,
    };
    this.backgroundWrapper.addOverlayObject(this.previewData.overlay);
    this.previewData.overlay.scale.set(1/this.backgroundWrapper.getScale());

    const textBackground = new PIXI.Graphics();
    this.previewData.overlay.addChild(textBackground);

    const text = new PIXI.Text(showString);
    this.previewData.overlay.addChild(text);
    text.style = new PIXI.TextStyle({
      fill: "white",
      fontSize: 15,
    });
    text.position.set(PortPreviewManager.textPadding, PortPreviewManager.textPadding);



    const previewX = this.backgroundWrapper.getMousePos().x;
    const previewY = this.backgroundWrapper.getMousePos().y;
    this.previewData.overlay.position.set(previewX, previewY);

    const backgroundWidth = text.width + PortPreviewManager.textPadding*2;
    const backgroundHeight = text.height + PortPreviewManager.textPadding*2;

    textBackground.beginFill(0x333333);
    textBackground.drawRoundedRect(0, 0, backgroundWidth, backgroundHeight, PortPreviewManager.cornerRadius);

    this.backgroundWrapper.onPositionOrZoomChanged(() => { this.portHoverEnd(port); });
  }

  public portHoverEnd(port: PortWrapper): void {
    if (this.previewData !== null && this.previewData.port === port) {
      this.backgroundWrapper.removeOverlayObject(this.previewData.overlay);
      this.previewData = null;
    }
  }

  public editPort(port: PortWrapper, portId: string, vertexId: string): void {
    console.log("unimplemented");
  }

  public removePort(portId: string, vertexId: string): void {
    if (this.previewData !== null && this.previewData.portId === portId && this.previewData.vertexId === vertexId) {
      this.portHoverEnd(this.previewData.port);
    }
  }

  public removeVertex(vertexId: string): void {
    if (this.previewData !== null && this.previewData.vertexId === vertexId) {
      this.portHoverEnd(this.previewData.port);
    }
  }
}