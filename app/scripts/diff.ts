
type DiffableObject = {[key in string]: Diffable}
export type Diffable = number | string | boolean | DiffableObject;

type SimpleDiffRecord<T extends Diffable> = {
  before: T,
  after: T,
}

type ObjectDiffRecord<T extends DiffableObject> = {
  added?: {
    [key in keyof T]?: T[key];
  };
  removed?: {
    [key in keyof T]?: T[key];
  };
  changed?: {
    [key in keyof T]?: T[key] extends DiffableObject ? ObjectDiffRecord<T[key]> : SimpleDiffRecord<T[key]>;
  };
}

export function undoDiff<T extends Diffable>(
  after: T,
  diff: null | (T extends DiffableObject ? ObjectDiffRecord<T> : SimpleDiffRecord<T>),
): T {
  if (diff === null) return JSON.parse(JSON.stringify(after));

  if ((diff as SimpleDiffRecord<Diffable>).after !== undefined) {
    return JSON.parse(JSON.stringify((diff as SimpleDiffRecord<Diffable>).before)) as T;
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
    delete after[addedKey]
  }
  if (diff.removed !== undefined) for (const removedKey in diff.removed) {
    after[removedKey] = JSON.parse(JSON.stringify(diff.removed[removedKey]));
  }
  if (diff.changed !== undefined) for (const changedKey in diff.changed) {
    const attrDiff = diff.changed[changedKey];

    after[changedKey] = undoDiff(before[changedKey], attrDiff!);
  }

  return before;
}

export function applyDiff<T extends Diffable>(
  before: T,
  diff: null | (T extends DiffableObject ? ObjectDiffRecord<T> : SimpleDiffRecord<T>),
): T {
  if (diff === null) return JSON.parse(JSON.stringify(before));

  if ((diff as SimpleDiffRecord<Diffable>).after !== undefined) {
    return JSON.parse(JSON.stringify((diff as SimpleDiffRecord<Diffable>).after)) as T;
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
    delete after[removedKey];
  }
  if (diff.changed !== undefined) for (const changedKey in diff.changed) {
    const attrDiff = diff.changed[changedKey];

    after[changedKey] = applyDiff(before[changedKey], attrDiff!);
  }

  return after;
}

export type DiffType<T extends Diffable> = null | (T extends DiffableObject ? ObjectDiffRecord<T> : SimpleDiffRecord<T>);

export function createDiff<T extends Diffable>(
  before: T,
  after: T,
): DiffType<T> {
  // @TODO watch out for null? typeof null === "object" evaluates to true
  if (typeof before === "object" && typeof after === "object") {
    return createObjectDiff(before as DiffableObject, after as DiffableObject) as T extends DiffableObject ? ObjectDiffRecord<T> : SimpleDiffRecord<T>;
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
  const addedKeys = afterKeys.filter(k => beforeKeys.indexOf(k) === -1);
  const removedKeys = beforeKeys.filter(k => afterKeys.indexOf(k) === -1);
  const sharedKeys = beforeKeys.filter(k => afterKeys.indexOf(k) !== -1);
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
      objectDiff.changed[sharedKey] = diff as T[typeof sharedKey] extends DiffableObject ? ObjectDiffRecord<T[typeof sharedKey]> : SimpleDiffRecord<T[typeof sharedKey]>;
      areIdentical = false;
    }
  }

  if (areIdentical) return null;
  else return objectDiff;
}
