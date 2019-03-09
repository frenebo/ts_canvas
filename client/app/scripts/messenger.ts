
/// <reference path="../../../interfaces/interfaces.d.ts"/>
/// <reference path="../../../interfaces/serverRequestInterfaces.d.ts"/>

import { getModelStandIn } from "./serverModelAdapter.js";

export type RequestModelChangesFunc = (...reqs: ModelChangeRequest[]) => Promise<void>;
export type RequestVersioningChangeFunc = (req: ModelVersioningRequest) => Promise<void>;
export type RequestInfoFunc = <V extends keyof IModelInfoReqs>(
  req: IModelInfoReqs[V]["request"],
) => Promise<IModelInfoReqs[V]["response"]>;

/**
 * Creates a messenger.
 * @returns The messenger
 */
export async function createMessenger(): Promise<Messenger> {
  const messenger = new Messenger();
  await messenger.init();
  return messenger;
}

/** Class for a messenger between the model and the view */
class Messenger {
  private views!: IViewInterface[];
  private model!: IModelInterface;

  /**
   * Initializes the messenger with a model stand-in, adds listeners to model.
   */
  public async init() {
    this.model = await getModelStandIn();
    this.views = [];

    this.model.onDataChanged(async (graphData) => {
      for (const view of this.views) {
        view.setGraphData(graphData);
      }
    });
  }

  /**
   * Adds a view for the model.
   * @param view - The new view
   */
  public async addView(view: IViewInterface): Promise<void> {
    this.views.push(view);
    const response = await this.model.requestModelInfo<"getGraphData">({
      type: "getGraphData",
    });
    const graphData = response.data;
    view.setGraphData(graphData);
  }

  /**
   * Returns a function for requesting changes to the model.
   * @returns An async function to request changes to the model
   */
  public newRequestHandler(): RequestModelChangesFunc {
    const that = this;
    return async (...reqs: ModelChangeRequest[]) => {
      return that.model.requestModelChanges(...reqs);
    };
  }

  /**
   * Returns a function for requesting versioning changes to the model.
   * @returns An async function to request versioning changes to the model
   */
  public newVersioningRequestHandler(): RequestVersioningChangeFunc {
    const that = this;
    return async (req: ModelVersioningRequest) => {
      return that.model.requestModelVersioningChange(req);
    };
  }

  /**
   * Returns a function for requesting info from the model.
   * @returns An async function to request info from the model
   */
  public newInfoRequestHandler(): RequestInfoFunc {
    const that = this;
    return async <V extends keyof IModelInfoReqs>(
      req: IModelInfoReqs[V]["request"],
    ): Promise<IModelInfoReqs[V]["response"]> => {
      return that.model.requestModelInfo(req);
    };
  }
}
