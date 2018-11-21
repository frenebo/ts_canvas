import { DragRegistry } from "./dragRegistry";

export class MenuBar {
  private static readonly height = 50;
  private static readonly itemWidth = 100;
  private static readonly itemSpacing = 10;
  private static readonly fillColor = 0x222222;

  private graphics: PIXI.Graphics;
  private menuItems: string[] = ["File", "Edit"];

  constructor(dragRegistry: DragRegistry) {
    this.graphics = new PIXI.Graphics();
    this.graphics.beginFill(MenuBar.fillColor);
    this.graphics.drawRect(
      0,
      0,
      this.menuItems.length*MenuBar.itemWidth + (this.menuItems.length + 1)*MenuBar.itemSpacing,
      MenuBar.height,
    );

    this.addMenuItems();

    // Block dragging of background
    this.graphics.interactive = true;

    dragRegistry.register(this.graphics);
  }

  public addTo(obj: PIXI.Container): void {
    obj.addChild(this.graphics);
  }

  private addMenuItems(): void {
    for (let itemIdx = 0; itemIdx < this.menuItems.length; itemIdx++) {
      const menuItemName = this.menuItems[itemIdx];
      const menuItem = new MenuItem(menuItemName, MenuBar.itemWidth, MenuBar.height);
      menuItem.addTo(this.graphics);
      menuItem.setPosition(itemIdx*MenuBar.itemWidth + (itemIdx + 1)*MenuBar.itemSpacing, 0);
    }
  }
}

class MenuItem {
  private static fillColor = 0x444444;

  private text: PIXI.Text;

  private width: number;
  private height: number;

  // private sta
  private graphics: PIXI.Graphics;
  constructor(label: string, w: number, h: number) {
    this.graphics = new PIXI.Graphics();
    this.width = w;
    this.height = h;

    this.graphics.interactive = true;
    this.graphics.buttonMode = true;

    this.graphics.beginFill(MenuItem.fillColor);

    // set the line style to have a width of 5 and set the color to red
    // this.graphics.lineStyle(MenuItem.borderWidth, MenuItem.borderColor);
    this.graphics.drawRect(0, 0, this.width, this.height);

    const textStyle = new PIXI.TextStyle({
      fontFamily: 'Arial',
      fontSize: 30,
      fontStyle: 'italic',
      fontWeight: 'bold',
      fill: ['#ffffff', '#00ff99'], // gradient
      stroke: '#4a1850',
      strokeThickness: 5,
      dropShadow: true,
      dropShadowColor: '#000000',
      dropShadowBlur: 4,
      dropShadowAngle: Math.PI / 6,
      dropShadowDistance: 6,
      // wordWrap: true,
      // wordWrapWidth: 440,
    });

    this.text = new PIXI.Text(label, textStyle);

    this.centerText();

    this.graphics.addChild(this.text);
  }

  public addTo(obj: PIXI.Container): void {
    obj.addChild(this.graphics);
  }

  private centerText(): void {
    this.text.x = (this.width - this.text.width)/2;
    this.text.y = (this.height - this.text.height)/2;
  }

  public setPosition(x: number, y: number): void {
    this.graphics.position.set(x, y);
  }
}
