import { ModelInterface, ViewInterface } from "./interfaces";


export class Messenger {
  private model: ModelInterface;
  private views: ViewInterface[];

  constructor(model: ModelInterface) {
    this.model = model;
    this.views = [];
  }

  public addView(view: ViewInterface): void {
    this.views.push(view);
    view.setModelData(this.model.getModelData());

    setTimeout(() => {
      view.setModelData({
        vertices: {}
      });
    }, 100);
  }
}
