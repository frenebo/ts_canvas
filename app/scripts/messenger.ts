import {
  ModelInterface, ViewInterface, ModelChangeRequest,
  ModelVersioningRequest,
  ModelInfoReqs,
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

  public newRequestHandler(): (...reqs: ModelChangeRequest[]) => Promise<boolean> {
    const that = this;
    return (...reqs: ModelChangeRequest[]) => {
      return new Promise<boolean>((resolve, reject) => {
        that.model.requestModelChanges(...reqs);
        setTimeout(() => {
          resolve(true);
        }, 500);
      });
    }
  }

  public newInfoRequestHandler() {
    const that = this;
    return <V extends keyof ModelInfoReqs>(req: ModelInfoReqs[V]["request"]): Promise<ModelInfoReqs[V]["response"]> => {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          resolve(that.model.requestModelInfo(req));
        }, 500);
      });
    };
  }

  public newVersioningRequestHandler(): (req: ModelVersioningRequest) => Promise<boolean> {
    const that = this;
    return (req: ModelVersioningRequest) => {
      return new Promise((resolve, reject) => {
        that.model.requestVersioningChange(req);
        setTimeout(() => {
          resolve(true);
        }, 500);
      });
    };
  }
}
