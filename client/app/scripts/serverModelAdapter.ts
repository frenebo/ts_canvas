
const SERVER_SOCKET_PATH = `/socket_path`;

export async function getModelStandIn(): Promise<ModelStandIn> {
  const model = new ModelStandIn();
  return model;
}

declare const io: any;

/** Class that implements the IModelInterface and acts as a wrapper for the server's model */
class ModelStandIn implements IModelInterface {
  private socketio: any;
  private graphDataChangedListeners: Array<(newGraph: IGraphData) => void> = [];

  private pendingRequestListeners: {[requestId: string]: (val: any) => void} = {};

  /**
   * Constructs a model stand-in.
   */
  constructor() {
    this.socketio = io(SERVER_SOCKET_PATH);

    this.socketio.on("graph_changed", (message: {newGraph: IGraphData}) => {
      console.log(message);
      for (const listener of this.graphDataChangedListeners) {
        listener(message.newGraph);
      }
    });

    this.socketio.on(
      "model_req_response",
      (message: {
        request_id: string;
        response: IServerReqTypes[keyof IServerReqTypes]["response"];
      }) => {
        // console.log(message);
        // console.log(this.pendingRequests);
        const pendingReq = this.pendingRequestListeners[message.request_id];
        if (pendingReq === undefined) {
          console.log("Request does not match");
          return;
        }

        pendingReq(message.response);
        delete this.pendingRequestListeners[message.request_id];
      },
    );
  }

  /**
   * Requests info about the model.
   * @param req - The model info request
   * @returns The promise for a response to the info request
   */
  public async requestModelInfo<T extends keyof IModelInfoReqs>(
    req: IModelInfoReqs[T]["request"],
  ): Promise<IModelInfoReqs[T]["response"]> {
    const serverResponse = await this.makeRequest<"request_model_info">({
      type: "request_model_info",
      req: req,
    });
    return serverResponse;
  }

  /**
   * Requests changes to the model.
   * @param reqs - The model change requests.
   * @returns An empty promise for when the request finishes
   */
  public async requestModelChanges(...reqs: ModelChangeRequest[]): Promise<void> {
    await this.makeRequest<"request_model_changes">({
      type: "request_model_changes",
      reqs: reqs,
    });
  }

  /**
   * Requests a versioning change to the model.
   * @param req - The model versioning change request
   * @returns An empty promise for when the request finishes
   */
  public async requestModelVersioningChange(req: ModelVersioningRequest): Promise<void> {
    await this.makeRequest<"request_versioning_change">({
      type: "request_versioning_change",
      req: req,
    });
  }

  /**
   * Adds a listener to be called whenever the model data changes.
   * @param listener - The listener
   */
  public onDataChanged(listener: (newGraph: IGraphData) => void): void {
    this.graphDataChangedListeners.push(listener);
  }

  /**
   * Internal method to make a request to the server.
   * @param req - The request to send to the server
   * @returns - A promise for a server request response
   */
  private async makeRequest<T extends keyof IServerReqTypes>(
    req: IServerReqTypes[T]["request"],
  ): Promise<IServerReqTypes[T]["response"]> {
    const id = this.getUniqueRequestId();
    const message: MessageToServer = {
      requestId: id,
      request: req,
    };

    const promise = new Promise<IServerReqTypes[T]["response"]>((resolve) => {
      const startTime: number = performance.now();
      this.pendingRequestListeners[id] = (val: IServerReqTypes[T]["response"]) => {
        resolve(val);
        console.log(req.type + " time: " + (performance.now() - startTime));
      };
    });

    this.socketio.emit("model_request", message);

    return promise;
  }

  /**
   * Creates a unique id for a request to send to the server.
   */
  private getUniqueRequestId(): string {
    const num = Math.random();
    let multiplier = 1000;
    // This keeps multiplying the random float by 10 until the resulting integer is different
    // from all of the currently existing request ids.
    while (this.pendingRequestListeners[Math.floor(num * multiplier).toString()] !== undefined) {
      multiplier *= 10;
    }

    return Math.floor(num * multiplier).toString();
  }
}
