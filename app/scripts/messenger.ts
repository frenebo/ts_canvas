import {
  ModelInterface, ViewInterface, ModelChangeRequest,
  ModelInfoReqs,
  ModelVersioningRequest,
} from "./interfaces.js";


export type RequestModelChangesFunc = (...reqs: ModelChangeRequest[]) => Promise<void>;
export type RequestVersioningChangeFunc = (req: ModelVersioningRequest) => Promise<void>;
export type RequestInfoFunc = <V extends keyof ModelInfoReqs>(req: ModelInfoReqs[V]["request"]) => Promise<ModelInfoReqs[V]["response"]>;

export class Messenger {
  private readonly model: ModelInterface;
  private readonly views: ViewInterface[];

  constructor(model: ModelInterface) {
    this.model = model;
    this.views = [];

    this.model.addGraphChangedListener(() => {
      // console.log("Setting graph data");
      for (const view of this.views) {
        view.setGraphData(this.model.getGraphData());
      }
    });
  }

  public addView(view: ViewInterface): void {
    this.views.push(view);
    view.setGraphData(this.model.getGraphData());
  }

  public newRequestHandler(): RequestModelChangesFunc {
    const that = this;
    return (...reqs: ModelChangeRequest[]) => {
      return new Promise((resolve, reject) => {
        // console.log(`Change requests: ${reqs.map(req => req.type).join(", ")}`);
        setTimeout(() => {
          that.model.requestModelChanges(...reqs);
          resolve();
        });
      });
    }
  }

  public newVersioningRequestHandler(): RequestVersioningChangeFunc {
    const that = this;
    return (req: ModelVersioningRequest) => {
      return new Promise((resolve, reject) => {
        // console.log(`Versioning request: ${req.type}`);
        setTimeout(() => {
          that.model.requestModelVersioningChange(req);
          resolve();
        });
      })
    }
  }

  public newInfoRequestHandler(): RequestInfoFunc {
    const that = this;
    return <V extends keyof ModelInfoReqs>(req: ModelInfoReqs[V]["request"]): Promise<ModelInfoReqs[V]["response"]> => {
      console.log(`Info request: ${req.type}`);
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          resolve(that.model.requestModelInfo(req));
        });
      });
    };
  }
}
