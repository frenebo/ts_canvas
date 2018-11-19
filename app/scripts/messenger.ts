import { ModelInterface, ViewInterface } from "./interfaces";


export class Messenger {
  private model: ModelInterface;
  private views: ViewInterface[];

  constructor(model: ModelInterface) {
    this.model = model;
    this.views = [];

    this.model.addModelChangedListener(() => {
      for (const view of this.views) {
        view.setModelData(this.model.getModelData());
      }
    });
  }

  public addView(view: ViewInterface): void {
    this.views.push(view);
    view.setModelData(this.model.getModelData());

    // setTimeout(() => {
    //   view.setModelData({
    //     vertices: {
    //       "someVertex": {
    //         geo: {
    //           x: 100,
    //           y: 100,
    //           w: 100,
    //           h: 100,
    //         },
    //         ports: {}
    //       }
    //     }
    //   });
    // }, 200);
  }
}
