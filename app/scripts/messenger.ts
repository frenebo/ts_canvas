import {
  ModelInterface, ViewInterface, ModelChangeRequest, ModelInfoRequestType, ModelInfoRequestMap, ModelInfoResponseMap,
  ModelVersioningRequest,
} from "./interfaces.js";


export class Messenger {
  private readonly model: ModelInterface;
  private readonly views: ViewInterface[];

  constructor(model: ModelInterface) {
    this.model = model;
    this.views = [];

    this.model.addGraphChangedListener(() => {
      for (const view of this.views) {
        if (view.setGraphData !== undefined) {
          view.setGraphData(this.model.getGraphData());
        }
      }
    });
  }

  public addView(view: ViewInterface): void {
    this.views.push(view);
    if (view.setGraphData !== undefined) {
      view.setGraphData(this.model.getGraphData());
    }
  }

  public newRequestHandler(): (...reqs: ModelChangeRequest[]) => void {
    const that = this;
    return (...reqs: ModelChangeRequest[]) => {
      that.model.requestModelChanges(...reqs);
    };
  }

  public newInfoRequestHandler() {
    const that = this;
    return <V extends ModelInfoRequestType>(req: ModelInfoRequestMap[V]): ModelInfoResponseMap[V] => {
      return that.model.requestModelInfo(req);
    };
  }

  public newVersioningRequestHandler() {
    const that = this;
    return (req: ModelVersioningRequest) => {
      that.model.requestVersioningChange(req);
    };
  }
}
