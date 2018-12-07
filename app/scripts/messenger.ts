import {
  ModelInterface, ViewInterface, ModelChangeRequest,
  ModelInfoReqs,
} from "./interfaces.js";


export type RequestModelChangesFunc = (...reqs: ModelChangeRequest[]) => Promise<void>;
export type RequestInfoFunc = <V extends keyof ModelInfoReqs>(req: ModelInfoReqs[V]["request"]) => Promise<ModelInfoReqs[V]["response"]>;

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

  public newRequestHandler(): RequestModelChangesFunc {
    const that = this;
    return (...reqs: ModelChangeRequest[]) => {
      return new Promise((resolve, reject) => {
        that.model.requestModelChanges(...reqs);
        setTimeout(() => {
          resolve();
        }, 500);
      });
    }
  }

  public newInfoRequestHandler(): RequestInfoFunc {
    const that = this;
    return <V extends keyof ModelInfoReqs>(req: ModelInfoReqs[V]["request"]): Promise<ModelInfoReqs[V]["response"]> => {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          resolve(that.model.requestModelInfo(req));
        }, 500);
      });
    };
  }
}
