// type imports should disappear after transpilation
import { Diffable, SimpleDiffRecord, ObjectDiffRecord, DiffableObject } from "./diff";

function undoDiff<T extends Diffable>(
  after: T,
  diff: null | (T extends DiffableObject ? ObjectDiffRecord<T> : SimpleDiffRecord<T>),
): T {
  // new Worker(DIFF_WORKER_PATH);
  if (diff === null) return JSON.parse(JSON.stringify(after));

  if ((diff as {after: unknown}).after !== undefined) {
    return JSON.parse(JSON.stringify((diff as {before: unknown}).before)) as T;
  } else {
    return undoObjectDiff(after as DiffableObject, diff as ObjectDiffRecord<DiffableObject>) as T;
  }
}

function undoObjectDiff<T extends DiffableObject>(
  after: T,
  diff: ObjectDiffRecord<T>,
): T {
  const before: T = JSON.parse(JSON.stringify(after));
  if (diff.added !== undefined) for (const addedKey in diff.added) {
    if (Array.isArray(before)) {
      before.splice(parseInt(addedKey), 1); // for when a value was added to the end
    } else {
      delete before[addedKey];
    }
  }
  if (diff.removed !== undefined) for (const removedKey in diff.removed) {
    before[removedKey] = JSON.parse(JSON.stringify(diff.removed[removedKey]));
  }
  if (diff.changed !== undefined) for (const changedKey in diff.changed) {
    const attrDiff = diff.changed[changedKey]!;

    before[changedKey] = undoDiff(before[changedKey], attrDiff!);
  }

  return before;
}

function applyDiff<T extends Diffable>(
  before: T,
  diff: null | (T extends DiffableObject ? ObjectDiffRecord<T> : SimpleDiffRecord<T>),
): T {
  if (diff === null) return JSON.parse(JSON.stringify(before));

  if ((diff as {after: unknown}).after !== undefined) {
    return JSON.parse(JSON.stringify((diff as {after: unknown}).after)) as T;
  } else {
    return applyObjectDiff(before as DiffableObject, diff as ObjectDiffRecord<DiffableObject>) as T;
  }
}

function applyObjectDiff<T extends DiffableObject>(
  before: T,
  diff: ObjectDiffRecord<T>,
): T {
  const after: T = JSON.parse(JSON.stringify(before));
  if (diff.added !== undefined) for (const addedKey in diff.added) {
    after[addedKey] = JSON.parse(JSON.stringify(diff.added[addedKey]));
  }
  if (diff.removed !== undefined) for (const removedKey in diff.removed) {
    if (Array.isArray(after)) {
      after.splice(parseInt(removedKey), 1); // for when a value has been removed from the end
    } else {
      delete after[removedKey];
    }
  }
  if (diff.changed !== undefined) for (const changedKey in diff.changed) {
    const attrDiff = diff.changed[changedKey];

    after[changedKey] = applyDiff(before[changedKey], attrDiff!);
  }

  return after;
}

type DiffType<T extends Diffable> =
  null | (T extends DiffableObject ? ObjectDiffRecord<T> : SimpleDiffRecord<T>);

function createDiff<T extends Diffable>(
  before: T,
  after: T,
): DiffType<T> {
  if (typeof before === "object" && typeof after === "object" && before !== null && after !== null) {
    return createObjectDiff(
      before as DiffableObject,
      after as DiffableObject,
    ) as T extends DiffableObject ? ObjectDiffRecord<T> : SimpleDiffRecord<T>;
  } else {
    const beforeStr = JSON.stringify(before);
    const afterStr = JSON.stringify(after);

    if (beforeStr === afterStr) return null;

    return {
      before: JSON.parse(beforeStr),
      after: JSON.parse(afterStr),
    } as T extends DiffableObject ? ObjectDiffRecord<T> : SimpleDiffRecord<T>;
  }
}

function createObjectDiff<T extends DiffableObject>(
  before: T,
  after: T,
): ObjectDiffRecord<T> | null {
  let areIdentical = true;
  const objectDiff = {} as ObjectDiffRecord<T>;

  const beforeKeys = Object.keys(before);
  const afterKeys = Object.keys(after);
  const addedKeys = afterKeys.filter((k) => beforeKeys.indexOf(k) === -1);
  const removedKeys = beforeKeys.filter((k) => afterKeys.indexOf(k) === -1);
  const sharedKeys = beforeKeys.filter((k) => afterKeys.indexOf(k) !== -1);
  for (const addedKey of addedKeys) {
    if (objectDiff.added === undefined) objectDiff.added = {};

    objectDiff.added[addedKey] = JSON.parse(JSON.stringify(after[addedKey]));
    areIdentical = false;
  }
  for (const removedKey of removedKeys) {
    if (objectDiff.removed === undefined) objectDiff.removed = {};

    objectDiff.removed[removedKey] = JSON.parse(JSON.stringify(before[removedKey]));
    areIdentical = false;
  }
  for (const sharedKey of sharedKeys) {
    const diff = createDiff(before[sharedKey], after[sharedKey]);
    if (diff !== null) {
      if (objectDiff.changed === undefined) objectDiff.changed = {};

      objectDiff.changed[sharedKey] =
        diff as T[typeof sharedKey] extends DiffableObject ?
          ObjectDiffRecord<T[typeof sharedKey]> :
          SimpleDiffRecord<T[typeof sharedKey]>;

      areIdentical = false;
    }
  }

  if (areIdentical) return null;
  else return objectDiff;
}

onmessage = (ev) => {
  const data = ev.data as {
    type: "undoDiff";
    after: Diffable;
    diff: DiffType<Diffable>;
  } | {
    type: "applyDiff";
    before: Diffable;
    diff: DiffType<Diffable>;
  } | {
    type: "createDiff";
    before: Diffable;
    after: Diffable;
  };

  let replyData: unknown;
  if (data.type === "undoDiff") {
    replyData = undoDiff(data.after, data.diff);
  } else if (data.type === "applyDiff") {
    replyData = applyDiff(data.before, data.diff);
  } else if (data.type === "createDiff"){
    replyData = createDiff(data.before, data.after);
  } else {
    throw new Error("Unknown diff type");
  }

  (postMessage as (data: unknown) => unknown)(replyData);
}
