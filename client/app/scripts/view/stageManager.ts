import { BackgroundWrapper } from "./graphicWrappers/backgroundWrapper.js";
import { EdgeWrapper } from "./graphicWrappers/edgeWrapper.js";
import { VertexWrapper } from "./graphicWrappers/vertexWrapper.js";
import { StageInterface } from "./stageInterface.js";

/** Class for managing the stage */
export class StageManager {
  private readonly app: PIXI.Application;
  private readonly childContainer: PIXI.Container;
  private readonly overlayContainer: PIXI.Container;
  private readonly backgroundWrapper: BackgroundWrapper;
  private readonly positionZoomChangedListeners: Array<() => void> = [];
  private readonly stageInterface: StageInterface;

  /**
   * Constructs a stage manager.
   * @param div - The div for the PIXI graph to go into
   */
  constructor(div: HTMLDivElement) {
    this.app = new PIXI.Application();
    div.appendChild(this.app.view);

    this.app.ticker.start(); // to keep refreshing screen

    this.backgroundWrapper = new BackgroundWrapper(this.app.renderer);
    this.app.stage.addChild(this.backgroundWrapper.getDisplayObject());
    this.childContainer = new PIXI.Container();
    this.app.stage.addChild(this.childContainer);
    this.overlayContainer = new PIXI.Container();
    this.app.stage.addChild(this.overlayContainer);

    this.app.view.addEventListener("wheel", (ev) => {
      const mouseXInStageFrame = this.getMousePos().x;
      const mouseYInStageFrame = this.getMousePos().y;

      const scrollFactor = Math.pow(1.003, -ev.deltaY);
      this.setScale(this.getScale() * scrollFactor);

      const moveStageX = (this.getMousePos().x - mouseXInStageFrame) * this.getScale();
      const moveStageY = (this.getMousePos().y - mouseYInStageFrame) * this.getScale();

      this.setGraphAbsolutePosition(
        this.stageXOffset() + moveStageX,
        this.stageYOffset() + moveStageY,
      );
    });

    this.stageInterface = new StageInterface(
      this.app.renderer,
      () => this.getScale(),
      (l) => { this.onPositionOrZoomChanged(l); },
      () => this.getMousePos(),
      (obj) => { this.addOverlayChild(obj); },
      (obj) => { this.removeOverlayChild(obj); },
      () => this.stageXOffset(),
      () => this.stageYOffset(),
      () => this.backgroundWrapper.getDisplayObject(),
      (data) => this.getDataRelativeLoc(data),
      (x, y) => { this.setGraphAbsolutePosition(x, y); },
      () => this.app.renderer.width,
      () => this.app.renderer.height,
    );
  }
  
  /**
   * Sets the dimensions of the graph.
   * @param width - The new width of the graph
   * @param height - The new height of the graph
   */
  public setDimensions(width: number, height: number): void {
    this.backgroundWrapper.setDimensions(width, height);
    this.app.renderer.resize(width, height);
    
    for (const listener of this.positionZoomChangedListeners) {
      listener();
    }
  }

  /**
   * Removes an edge from the graph.
   * @param edge - The edge wrapper
   */
  public removeEdge(edge: EdgeWrapper): void {
    edge.removeFrom(this.childContainer);
  }

  /**
   * Removes a vertex from the graph.
   * @param vertex - The vertex wrapper
   */
  public removeVertex(vertex: VertexWrapper): void {
    vertex.removeFrom(this.childContainer);
  }

  /**
   * Adds a vertex to the stage.
   * @param vertex - The vertex wrapper
   */
  public addVertex(vertex: VertexWrapper): void {
    vertex.addTo(this.childContainer);
  }

  /**
   * Adds an edge to the stage.
   * @param edge - The edge wrapper
   */
  public addEdge(edge: EdgeWrapper): void {
    edge.addTo(this.childContainer);
  }

  /**
   * Adds a listener to be called when the user view's zoom or position changes.
   * @param l - The listener
   */
  public onPositionOrZoomChanged(l: () => void): void {
    this.positionZoomChangedListeners.push(l);
  }
  
  /**
   * Gives the stage interface for this stage manager.
   * @returns The stage interface
   */
  public getStageInterface(): StageInterface {
    return this.stageInterface;
  }

  /**
   * Gives the position of the mouse relative to the graph, adjusted for zoom.
   * @returns An object the mouse's X and Y positions
   */
  public getMousePos(): {x: number; y: number} {
    const globalMouseX = this.app.renderer.plugins.interaction.mouse.global.x;
    const globalMouseY = this.app.renderer.plugins.interaction.mouse.global.y;

    // The renderer may not know the mouse position, resulting in it returning
    // very low numbers for x and y.
    if (globalMouseX < -10000 && globalMouseY < -10000) {
      return {
        x: 0,
        y: 0,
      };
    }
    
    const mouseX: number =
      globalMouseX / this.getScale() - this.stageXOffset() / this.getScale();

    const mouseY: number =
      globalMouseY / this.getScale() - this.stageYOffset() / this.getScale();

    return {
      x: mouseX,
      y: mouseY,
    };
  }

  /**
   * Gives the position of a PIXI interaction relative to the graph.
   * @param data - The PIXI interaction's data
   */
  private getDataRelativeLoc(data: PIXI.interaction.InteractionData): PIXI.Point {
    return data.getLocalPosition(this.childContainer);
  }

  /**
   * Adds a PIXI display object to the stage's overlay container.
   * @param obj - The PIXI display object to add
   */
  private addOverlayChild(obj: PIXI.DisplayObject): void {
    this.overlayContainer.addChild(obj);
  }

  /**
   * Removes a PIXI display object from the stage's overlay container.
   * @param obj - The PIXI display object to remove
   */
  private removeOverlayChild(obj: PIXI.DisplayObject): void {
    this.overlayContainer.removeChild(obj);
  }

  /**
   * Sets the zoom scale of the graph.
   * @param scale - The new scale
   */
  private setScale(scale: number): void {
    this.childContainer.scale.set(scale);
    this.backgroundWrapper.setScale(scale);
    this.overlayContainer.scale.set(scale);

    for (const listener of this.positionZoomChangedListeners) {
      listener();
    }
  }

  /**
   * Sets the absolute position of the graph.
   * @param x - The new X position
   * @param y - The new Y position
   */
  private setGraphAbsolutePosition(x: number, y: number): void {
    this.childContainer.position.set(x, y);
    this.backgroundWrapper.setPosition(x, y);
    this.overlayContainer.position.set(x, y);

    for (const listener of this.positionZoomChangedListeners) {
      listener();
    }
  }

  /**
   * Gets the scale of the graph.
   * @returns The graph's scale
   */
  private getScale(): number {
    return this.childContainer.scale.x;
  }

  /**
   * Gets the X position of the stage.
   * @returns The stage's X position
   */
  private stageXOffset(): number {
    return this.childContainer.position.x;
  }

  /**
   * Gets the Y position of the stage.
   * @returns The stage's Y position
   */
  private stageYOffset(): number {
    return this.childContainer.position.y;
  }
}
