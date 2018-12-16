
/// <reference path="../../../interfaces/interfaces.d.ts"/>
/// <reference path="../../../interfaces/serverRequestInterfaces.d.ts"/>

import { getModelStandIn } from "./serverModelAdapter.js";

export type RequestModelChangesFunc = (...reqs: ModelChangeRequest[]) => Promise<void>;
export type RequestVersioningChangeFunc = (req: ModelVersioningRequest) => Promise<void>;
export type RequestInfoFunc = <V extends keyof IModelInfoReqs>(
  req: IModelInfoReqs[V]["request"],
) => Promise<IModelInfoReqs[V]["response"]>;

export async function createMessenger(): Promise<Messenger> {
  const messenger = new Messenger();
  await messenger.init();
  return messenger;
}

class Messenger {
  private views!: IViewInterface[];
  private model!: IModelInterface;
  private currentVersionId: string | undefined;

  public async init() {
    this.model = await getModelStandIn();
    this.views = [];

    this.model.onDataChanged(async () => {
      const response = await this.model.requestModelInfo<"getGraphData">({
      type: "getGraphData",
      });
      const graphData = response.data;
      for (const view of this.views) {
        view.setGraphData(graphData);
      }
    });
  }

  public async addView(view: IViewInterface): Promise<void> {
    this.views.push(view);
    const response = await this.model.requestModelInfo<"getGraphData">({
      type: "getGraphData",
    });
    const graphData = response.data;
    view.setGraphData(graphData);
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
