import {
  ModelInterface, ViewInterface, ModelChangeRequest,
  ModelInfoReqs,
  ModelVersioningRequest,
} from "./interfaces.js";

export type RequestModelChangesFunc = (...reqs: ModelChangeRequest[]) => Promise<void>;
export type RequestVersioningChangeFunc = (req: ModelVersioningRequest) => Promise<void>;
export type RequestInfoFunc = <V extends keyof ModelInfoReqs>(
  req: ModelInfoReqs[V]["request"],
) => Promise<ModelInfoReqs[V]["response"]>;

export class Messenger {
  private readonly model: ModelInterface;
  private readonly views: ViewInterface[];

  constructor(model: ModelInterface) {
    this.model = model;
    this.views = [];

    this.model.onDataChanged(async () => {
      const graphData = await this.model.getGraphData();
      for (const view of this.views) {
        view.setGraphData(graphData);
      }
    });
  }

  public async addView(view: ViewInterface): Promise<void> {
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
    return async <V extends keyof ModelInfoReqs>(
      req: ModelInfoReqs[V]["request"],
    ): Promise<ModelInfoReqs[V]["response"]> => {
      return that.model.requestModelInfo(req);
    };
  }
}
