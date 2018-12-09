import {
  undoDiff,
  Diffable,
  applyDiff,
  DiffType,
  createDiff
} from "../../diff.js";
import { DIFF_WORKER_PATH } from "../../constants.js";

class WorkerManager {
  private readonly workers: Array<{
    busy: boolean;
    worker: Worker;
  }> = [];


  private waitingForWorkers: Array<{
    resolve: (val: {
      worker: Worker,
      free: () => void,
    }) => void;
  }> = [];

  constructor() {
    const workerCount = Math.max(
      navigator.hardwareConcurrency,
      1, // just in case
    );

    for (let i = 0; i < workerCount; i++) {
      this.workers.push({
        busy: false,
        worker: new Worker(DIFF_WORKER_PATH),
      });
    }
  }

  public checkoutWorker(): Promise<{
    worker: Worker,
    free: () => void,
  }> {
    for (const worker of this.workers) {
      if (!worker.busy) {
        worker.busy = true;
        return Promise.resolve({
          worker: worker.worker,
          free: () => this.checkInWorker(worker),
        });
      }
    }

    return new Promise(resolve => {
      this.waitingForWorkers.push({
        resolve: resolve,
      });
    });
  }

  private checkInWorker(worker: {
    busy: boolean,
    worker: Worker,
  }): void {
    worker.busy = false;
    if (this.waitingForWorkers.length !== 0) {
      const firstInLine = this.waitingForWorkers.splice(0, 1)[0];
      firstInLine.resolve({
        worker: worker.worker,
        free: () => this.checkInWorker(worker),
      })
    }
  }
}

export class VersioningManager<T extends Diffable> {
  private readonly pastDiffs: Array<{
    type: "processing";
  } | {
    type: "done";
    diff: DiffType<T>;
  }> = [];
  private readonly futureDiffs: Array<{
    diff: DiffType<T>
  }> = [];

  private currentVal: T;
  private workerManager: WorkerManager;

  constructor(val: T) {
    this.currentVal = val;
    this.workerManager = new WorkerManager();
  }


  public async recordChange(val: T): Promise<void> {
    const beforeVal: T = JSON.parse(JSON.stringify(this.currentVal));
    const afterVal: T = JSON.parse(JSON.stringify(val));
    this.currentVal = val;

    const {worker, free} = await this.workerManager.checkoutWorker();

    const diffPromise = createDiff(beforeVal, afterVal, worker);

    const newPastDiff: {
      type: "processing";
    } = {
      type: "processing",
    };
    this.pastDiffs.push(newPastDiff);
    diffPromise.then(diffVal => {
      free();
      const replaceIdx = this.pastDiffs.indexOf(newPastDiff);
      this.pastDiffs.splice(replaceIdx, 1, {
        type: "done",
        diff: diffVal,
      });
    });
  }
}
