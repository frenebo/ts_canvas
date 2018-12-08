import { SessionData } from "./model.js";
import {
  undoDiff,
  Diffable,
  applyDiff
} from "../../diff.js";
import {
  SessionUtils,
  SessionDataJson
} from "./sessionUtils.js";

interface VersioningWorkerReq {
  id: string;
}

class VersioningWebWorkerInterface {
  private worker: Worker;
  private pendingRequests: Array<VersioningWorkerReq> = [];
  constructor() {
    this.worker = new Worker("scripts/models/default_model/worker/webWorker.js");
    this.worker.onmessage = (ev) => {

    }
  }
  private idCounter = 0;
  private getNewReqId(): string {
    return (this.idCounter++).toString();
  }
}

if (!(window as any).Worker) {
  alert("Browser does not support WebWorkers");
}
const worker = new Worker("scripts/models/default_model/worker/webWorker.js");
worker.onmessage = function(e) {
	console.log('Main (myWorker.onmessage): Message received from worker');
}
worker.postMessage([123, 345]);

export class VersioningUtils {
  public static async undo(session: SessionData): Promise<void> {
    if (session.pastDiffs.length === 0) return;
    const pastDiff = session.pastDiffs.pop()!;

    const dataJson = SessionUtils.toJson(session.data);
    const newData = undoDiff(dataJson as unknown as Diffable, pastDiff) as unknown as SessionDataJson;

    session.futureDiffs.splice(0, 0, pastDiff);

    session.data = SessionUtils.fromJson(newData);
    if (session.openFile !== null) {
      if (typeof session.openFile.fileIdxInHistory === "number") {
        session.openFile.fileIdxInHistory--;
      }
    }
  }

  public static async redo(session: SessionData): Promise<void> {
    if (session.futureDiffs.length === 0) return;
    const redoDiff = session.futureDiffs.splice(0, 1)[0];

    const dataJson = SessionUtils.toJson(session.data)
    const newData = applyDiff(dataJson as unknown as Diffable, redoDiff) as unknown as SessionDataJson;

    session.pastDiffs.push(redoDiff);
    session.data = SessionUtils.fromJson(newData);
    if (session.openFile !== null) {
      if (typeof session.openFile.fileIdxInHistory === "number") {
        session.openFile.fileIdxInHistory++;
      }
    }
  }
}
