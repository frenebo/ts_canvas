
const SERVER_SOCKET_PATH = `/socket_path`;

export async function getModelStandIn(): Promise<ModelStandIn> {
  const model = new ModelStandIn();
  return model;
}

declare const io: any;

class ModelStandIn implements IModelInterface {
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

  // @TODO should wait until the graph confirms that this is listening?
  public async onDataChanged(listener: () => void): Promise<void> {
    this.graphDataChangedListeners.push(listener);
  }

  private socketio: any;
  private graphDataChangedListeners: Array<() => void> = [];
  constructor() {
    this.socketio = io(SERVER_SOCKET_PATH);
    this.socketio.on("model_req_response", function(id: unknown, msg: unknown) {
      console.log(id, msg);
    });
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
//
// class OldModelStandIn implements IModelInterface {
//   private getUniqueRequestId(): string {
//     const num = Math.random();
//     let multiplier = 1000;
//     while (this.pendingRequests[Math.floor(num*multiplier).toString()] !== undefined) {
//       multiplier *= 10;
//     }
//
//     return Math.floor(num*multiplier).toString();
//   }
//
//   private async makeRequest<T extends keyof IServerReqTypes>(
//     req: IServerReqTypes[T]["request"],
//   ): Promise<IServerReqTypes[T]["response"]> {
//     const id = this.getUniqueRequestId();
//     const message: MessageToServer = {
//       requestId: id,
//       request: req,
//     }
//     const promise = new Promise<IServerReqTypes[T]["response"]>((resolve) => {
//       this.pendingRequests[id] = (val: IServerReqTypes[T]["response"]) => resolve(val);
//     });
//
//     this.socket.send(JSON.stringify(message));
//
//     return promise;
//   }
//
//   private socket!: WebSocket;
//   private pendingRequests: {
//     [key: string]: (val: any) => void;
//   } = {};
//   private graphDataChangedListeners: Array<() => void> = [];
//
//   private socketIsConnected: Promise<void>;
//
//   constructor() {
//     const that = this;
//     this.socketIsConnected = new Promise((resolve) => {
//       function checkIsConnected() {
//         if (that.socket === undefined || that.socket.readyState !== 1) {
//           setTimeout(() => checkIsConnected(), 5);
//         } else {
//           resolve();
//         }
//       }
//       setTimeout(() => checkIsConnected(), 5);
//     });
//   }
//
//   public async init() {
//     this.socket = new WebSocket(SERVER_SOCKET_PATH);
//
//     await this.socketIsConnected;
//
//     this.socket.onmessage = (ev) => {
//       const parsed: MessageFromServer = JSON.parse(ev.data);
//
//       if (parsed.type === "graph_data_changed") {
//         for (const listener of this.graphDataChangedListeners) {
//           listener();
//         }
//       } else {
//         const reqId: string = parsed.requestId;
//         if (this.pendingRequests[reqId] !== undefined) {
//           this.pendingRequests[reqId](parsed.response);
//           delete this.pendingRequests[reqId];
//         }
//       }
//     }
//
//     await this.makeRequest({
//       type: "add_data_changed_listener",
//     });
//   }
//
//   public async requestModelInfo<T extends keyof IModelInfoReqs>(
//     req: IModelInfoReqs[T]["request"],
//   ): Promise<IModelInfoReqs[T]["response"]> {
//     const serverResponse = await this.makeRequest<"request_model_info">({
//       type: "request_model_info",
//       req: req,
//     });
//     return serverResponse.info;
//   }
//
//   public async requestModelChanges(...reqs: ModelChangeRequest[]): Promise<void> {
//     await this.makeRequest<"request_model_changes">({
//       type: "request_model_changes",
//       reqs: reqs,
//     });
//   }
//
//   public async requestModelVersioningChange(req: ModelVersioningRequest): Promise<void> {
//     await this.makeRequest<"request_versioning_change">({
//       type: "request_versioning_change",
//       req: req,
//     })
//   }
//
//   public async getGraphData(): Promise<IGraphData> {
//     const response = await this.makeRequest<"get_graph_data">({
//       type: "get_graph_data"
//     });
//
//     if (!response.success) {
//       return Promise.reject();
//     }
//
//     return response.data;
//   }
//
//   // @TODO should wait until the graph confirms that this is listening?
//   public async onDataChanged(listener: () => void): Promise<void> {
//     this.graphDataChangedListeners.push(listener);
//   }
// }
