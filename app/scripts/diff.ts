import { DIFF_WORKER_PATH } from "./constants.js";

export type DiffableObject = {
  [key: string]: Diffable;
};

export type Diffable = number | string | boolean | DiffableObject;

export interface SimpleDiffRecord<T extends Diffable> {
  before: T;
  after: T;
}

export interface ObjectDiffRecord<T extends DiffableObject> {
  added?: Partial<{
    [key in keyof T]: T[key];
  }>;
  removed?: Partial<{
    [key in keyof T]: T[key];
  }>;
  changed?: Partial<{
    [key in keyof T]: T[key] extends DiffableObject ? ObjectDiffRecord<T[key]> : SimpleDiffRecord<T[key]>;
  }>;
}

export function undoDiff<T extends Diffable>(
  after: T,
  diff: null | (T extends DiffableObject ? ObjectDiffRecord<T> : SimpleDiffRecord<T>),
): Promise<T> {
  return new Promise(resolve => {
    const worker = new Worker(DIFF_WORKER_PATH);
    worker.postMessage({
      type: "undoDiff",
      after: after,
      diff: diff,
    });
    worker.onmessage = (ev) => {
      resolve(ev.data as T);
      worker.terminate();
    }
  });
}

export function applyDiff<T extends Diffable>(
  before: T,
  diff: null | (T extends DiffableObject ? ObjectDiffRecord<T> : SimpleDiffRecord<T>),
): Promise<T> {
  return new Promise(resolve => {
    const worker = new Worker(DIFF_WORKER_PATH);
    worker.postMessage({
      type: "applyDiff",
      before: before,
      diff: diff,
    });
    worker.onmessage = (ev) => {
      resolve(ev.data as T);
      worker.terminate();
    }
  });
}

// @TODO stop terminating and creating workers?

export type DiffType<T extends Diffable> =
  null | (T extends DiffableObject ? ObjectDiffRecord<T> : SimpleDiffRecord<T>);

export function createDiff<T extends Diffable>(
  before: T,
  after: T,
): Promise<DiffType<T>> {
  return new Promise(resolve => {
    const worker = new Worker(DIFF_WORKER_PATH);
    worker.postMessage({
      type: "createDiff",
      before: before,
      after: after,
    });
    worker.onmessage = (ev) => {
      resolve(ev.data as DiffType<T>);
      worker.terminate();
    }
  });
}
