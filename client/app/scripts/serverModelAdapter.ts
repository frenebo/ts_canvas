
const SERVER_SOCKET_PATH = `/socket_path`;

export async function getModelStandIn(): Promise<ModelStandIn> {
  const model = new ModelStandIn();
  return model;
}

declare const io: any;
declare const applyDiff: DiffApplier;

class ModelStandIn implements IModelInterface {
  public async requestModelInfo<T extends keyof IModelInfoReqs>(
    req: IModelInfoReqs[T]["request"],
  ): Promise<IModelInfoReqs[T]["response"]> {
    const serverResponse = await this.makeRequest<"request_model_info">({
      type: "request_model_info",
      req: req,
    });
    return serverResponse;
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

  public async onDataChanged(listener: () => void): Promise<void> {
    this.graphDataChangedListeners.push(listener);
  }

  private socketio: any;
  private graphDataChangedListeners: Array<() => void> = [];
  constructor() {
    this.socketio = io(SERVER_SOCKET_PATH);

    this.socketio.on("graph_changed", () => {
      for (const listener of this.graphDataChangedListeners) {
        listener();
      }
    });

    this.socketio.on(
      "model_req_response",
      (message: {
        request_id: string;
        response: IServerReqTypes[keyof IServerReqTypes]["response"];
      }) => {
        console.log(message);
        console.log(this.pendingRequests);
        const pendingReq = this.pendingRequests[message.request_id];
        if (pendingReq === undefined) return;

        pendingReq(message.response);
        delete this.pendingRequests[message.request_id];
      },
    );
  }

  private pendingRequests: {[key: string]: (val: any) => void} = {};

  private async makeRequest<T extends keyof IServerReqTypes>(
    req: IServerReqTypes[T]["request"],
  ): Promise<IServerReqTypes[T]["response"]> {
    const id = this.getUniqueRequestId();
    const message: MessageToServer = {
      requestId: id,
      request: req,
    };

    const promise = new Promise<IServerReqTypes[T]["response"]>((resolve) => {
      this.pendingRequests[id] = (val: IServerReqTypes[T]["response"]) => {
        resolve(val);
      };
    });

    this.socketio.emit("model_request", message);

    return promise;
  }

  private getUniqueRequestId(): string {
    const num = Math.random();
    let multiplier = 1000;
    while (this.pendingRequests[Math.floor(num*multiplier).toString()] !== undefined) {
      multiplier *= 10;
    }

    return Math.floor(num*multiplier).toString();
  }
}
