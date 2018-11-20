import { DragRegistry } from "../dragRegistry";

export class EditIcon {
  private graphics: PIXI.Graphics;
  private clickListeners: Array<() => void> = [];

  constructor(dragRegistry: DragRegistry) {
    this.graphics = new PIXI.Graphics();

    this.graphics.interactive = true;
    this.graphics.buttonMode = true;

    const that = this;
    let buttonClicking = false;
    function clickBegin() {
      if (!dragRegistry.isLocked()) {
        buttonClicking = true;
        dragRegistry.lock();
        that.draw(true);
      }
    }
    function clickEnd() {
      if (buttonClicking) {
        buttonClicking = false;
        dragRegistry.unlock();

        that.graphics.clear();
        that.draw(false);

        for (const clickListener of that.clickListeners) {
          clickListener();
        }
      }
    }
    this.graphics
      .on('mousedown',       clickBegin)
      .on('touchstart',      clickBegin)
      .on('mouseup',         clickEnd)
      .on('mouseupoutside',  clickEnd)
      .on('touchend',        clickEnd)
      .on('touchendoutside', clickEnd);

    this.draw(false);
  }

  public addClickListener(listener: () => void): void {
    this.clickListeners.push(listener);
  }

  public addTo(obj: PIXI.Container): void {
    obj.addChild(this.graphics);
  }

  public setPosition(x: number, y: number): void {
    this.graphics.position.set(x, y);
  }

  public getWidth(): number {
    return this.graphics.width;
  }

  public getHeight(): number {
    return this.graphics.height;
  }

  private draw(clicking: boolean): void {
    this.graphics.beginFill(clicking ? 0x888888 : 0x555555);
    this.graphics.lineColor = 0x000000;
    this.graphics.lineWidth = 5;

    // pencil outline
    this.graphics.moveTo(0, 50);
    this.graphics.lineTo(0, 35);
    this.graphics.lineTo(35, 0);
    this.graphics.lineTo(50, 15);
    this.graphics.lineTo(15, 50);
    this.graphics.lineTo(0, 50);
    this.graphics.lineTo(0, 35);

    // eraser line
    this.graphics.moveTo(25, 10);
    this.graphics.lineTo(40, 25);
  }
}
