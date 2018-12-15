
/// <reference path="../../../interfaces/interfaces.d.ts"/>
/// <reference path="../../../interfaces/serverRequestInterfaces.d.ts"/>

export type RequestModelChangesFunc = (...reqs: ModelChangeRequest[]) => Promise<void>;
export type RequestVersioningChangeFunc = (req: ModelVersioningRequest) => Promise<void>;
export type RequestInfoFunc = <V extends keyof IModelInfoReqs>(
  req: IModelInfoReqs[V]["request"],
) => Promise<IModelInfoReqs[V]["response"]>;

const SERVER_SOCKET_PATH = "socket_path";

class ModelStandIn implements IModelInterface {
  private getUniqueRequestId(): string {
    const num = Math.random();
    let multiplier = 1000;
    while (this.pendingRequests[Math.floor(num*multiplier).toString()] !== undefined) {
      multiplier *= 10;
    }

    return Math.floor(num*multiplier).toString();
  }

  private async makeRequest<T extends keyof IServerReqTypes>(
    req: IServerReqTypes[T]["request"],
  ): Promise<IServerReqTypes[T]["response"]> {
    const id = this.getUniqueRequestId();
    const message: MessageToServer = {
      requestId: id,
      request: req,
    }
    const promise = new Promise<IServerReqTypes[T]["response"]>((resolve) => {
      this.pendingRequests[id] = (val: IServerReqTypes[T]["response"]) => resolve(val);
    });

    this.socket.send(JSON.stringify(message));

    return promise;
  }

  private socket: WebSocket;
  private pendingRequests: {
    [key: string]: (val: any) => void;
  } = {};
  private graphDataChangedListeners: Array<() => void> = [];

  constructor() {
    this.socket = new WebSocket(SERVER_SOCKET_PATH);
    this.socket.onmessage = (ev) => {
      const parsed: MessageFromServer = JSON.parse(ev.data);

      if (parsed.type === "graph_data_changed") {
        for (const listener of this.graphDataChangedListeners) {
          listener();
        }
      } else {
        const reqId: string = parsed.requestId;
        if (this.pendingRequests[reqId] !== undefined) {
          this.pendingRequests[reqId](parsed.response);
          delete this.pendingRequests[reqId];
        }
      }
    }

    this.makeRequest({
      type: "add_data_changed_listener",
    });
  }

  public async requestModelInfo<T extends keyof IModelInfoReqs>(
    req: IModelInfoReqs[T]["request"],
  ): Promise<IModelInfoReqs[T]["response"]> {
    const serverResponse = await this.makeRequest<"request_model_info">({
      type: "request_model_info",
      req: req,
    });
    return serverResponse.info;
  }

  public async requestModelChanges(...reqs: ModelChangeRequest[]): Promise<void> {
    await this.makeRequest<"request_model_changes">({
      type: "request_model_changes",
      reqs: reqs,
    });
  }

  public async requestModelVersioningChange(req: ModelVersioningRequest): Promise<void> {
    await this.makeRequest<"request_versioning_change">({
      type: "request_versioning_change",
      req: req,
    })
  }

  public async getGraphData(): Promise<IGraphData> {
    const response = await this.makeRequest<"get_graph_data">({
      type: "get_graph_data"
    });

    if (!response.success) {
      return Promise.reject();
    }

    return response.data;
  }

  public async onDataChanged(listener: () => void): Promise<void> {
    this.graphDataChangedListeners.push(listener);
  }
}

export class Messenger {
  private readonly views: IViewInterface[];
  private model: ModelStandIn;

  constructor() {
    this.model = new ModelStandIn();
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
