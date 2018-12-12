import {
  IModelInfoReqs,
  IModelInterface,
  IViewInterface,
  ModelChangeRequest,
  ModelVersioningRequest,
} from "./interfaces.js";

export type RequestModelChangesFunc = (...reqs: ModelChangeRequest[]) => Promise<void>;
export type RequestVersioningChangeFunc = (req: ModelVersioningRequest) => Promise<void>;
export type RequestInfoFunc = <V extends keyof IModelInfoReqs>(
  req: IModelInfoReqs[V]["request"],
) => Promise<IModelInfoReqs[V]["response"]>;

export class Messenger {
  private readonly model: IModelInterface;
  private readonly views: IViewInterface[];

  constructor(model: IModelInterface) {
    this.model = model;
    this.views = [];

    this.model.onDataChanged(async () => {
      const graphData = await this.model.getGraphData();
      for (const view of this.views) {
        view.setGraphData(graphData);
      }
    });
  }

  public async addView(view: IViewInterface): Promise<void> {
    this.views.push(view);
    view.setGraphData(await this.model.getGraphData());
  }

  public newRequestHandler(): RequestModelChangesFunc {
    const that = this;
    return async (...reqs: ModelChangeRequest[]) => {
      return that.model.requestModelChanges(...reqs);
    };
  }

  public newVersioningRequestHandler(): RequestVersioningChangeFunc {
    const that = this;
    return async (req: ModelVersioningRequest) => {
      return that.model.requestModelVersioningChange(req);
    };
  }

  public newInfoRequestHandler(): RequestInfoFunc {
    const that = this;
    return async <V extends keyof IModelInfoReqs>(
      req: IModelInfoReqs[V]["request"],
    ): Promise<IModelInfoReqs[V]["response"]> => {
      return that.model.requestModelInfo(req);
    };
  }
}
