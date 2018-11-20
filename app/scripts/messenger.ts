import { ModelInterface, ViewInterface, ModelChangeRequest, ModelInfoRequestType, ModelInfoRequestMap, ModelInfoResponseMap } from "./interfaces.js";


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
  }

  public newRequestHandler(): (req: ModelChangeRequest) => void {
    const that = this;
    return (req: ModelChangeRequest) => {
      that.model.requestModelChange(req);
    }
  }

  public newInfoRequestHandler() {
    const that = this;
    return <V extends ModelInfoRequestType>(req: ModelInfoRequestMap[V]): ModelInfoResponseMap[V] => {
      return that.model.requestModelInfo(req);
    }
  }
}
