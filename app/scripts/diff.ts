import { DeepReadonly } from "./interfaces";

type DiffableObject = DeepReadonly<{
  [key: string]: Diffable;
}>;

export type Diffable = number | string | boolean | DiffableObject;

// export type StringDiff = Array<{
//   afterPos: number,
//   beforePos: number,
//   insertLines?: string[],
//   removeLines?: string[],
// }>;
//
// createDiff(
// `hello
// something else
// hello again
// `,
// `hello
// hello again`);
//
// export type DiffType<T extends Diffable> = StringDiff;
//
// function makeIntoLines(obj: Diffable): string[] {
//   const text = JSON.stringify(obj, null, " ");
//   return text.split("\n");
// }
//
// export function createDiff<T extends Diffable>(beforeObj: T, afterObj: T): DiffType<T> {
//   const diff: StringDiff = [];
//
//   const beforeLines = makeIntoLines(beforeObj);
//   const afterLines = makeIntoLines(afterObj);
//
//   let beforeIdx = 0;
//   let afterIdx = 0;
//
//   while (true) {
//     const reachedEndOfBefore = beforeIdx >= beforeLines.length;
//     const reachedEndOfAfter = afterIdx >= afterLines.length;
//     if (reachedEndOfAfter && !reachedEndOfBefore) {
//       diff.push({
//         beforePos: beforeIdx,
//         afterPos: afterLines.length -1,
//         removeLines: beforeLines.slice(beforeIdx),
//       });
//       break;
//     }
//     if (!reachedEndOfAfter && reachedEndOfBefore) {
//       diff.push({
//         beforePos: beforeLines.length -1,
//         afterPos: afterIdx,
//         insertLines: afterLines.slice(afterIdx),
//       });
//       break;
//     }
//     if (reachedEndOfAfter && reachedEndOfBefore) {
//       break;
//     }
//
//     // skip past lines that are the same as each other
//     if (beforeLines[beforeIdx] === afterLines[afterIdx]) {
//       beforeIdx++;
//       afterIdx++;
//     } else {
//       let addedAfterLines: number | null = null;
//       let removedBeforeLines: number | null = null;
//
//       for (let checkBeforeLine = beforeIdx; checkBeforeLine < beforeLines.length; checkBeforeLine++) {
//         // second parameter for indexOf tells where to start
//         let idxInAfter = afterLines.indexOf(beforeLines[checkBeforeLine], afterIdx);
//
//         if (idxInAfter !== -1) {
//           addedAfterLines = idxInAfter - afterIdx;
//           removedBeforeLines = checkBeforeLine - beforeIdx;
//           break;
//         }
//       }
//
//       // if none of the remaining lines from before are used again
//       if (addedAfterLines === null || removedBeforeLines === null) {
//         diff.push({
//           afterPos: afterIdx,
//           beforePos: beforeIdx,
//           removeLines: beforeLines.slice(beforeIdx),
//           insertLines: afterLines.slice(afterIdx),
//         });
//
//         break;
//       } else {
//         const lineDiff: StringDiff[0] = {
//           afterPos: afterIdx,
//           beforePos: beforeIdx,
//         };
//
//         if (removedBeforeLines !== 0) {
//           lineDiff.removeLines = beforeLines.slice(beforeIdx, beforeIdx + removedBeforeLines);
//         }
//         if (addedAfterLines !== 0) {
//           lineDiff.insertLines = afterLines.slice(afterIdx, afterIdx + addedAfterLines);
//         }
//         diff.push(lineDiff);
//
//         beforeIdx += removedBeforeLines;
//         afterIdx += addedAfterLines;
//       }
//     }
//   }
//
//   console.log(diff);
//   return diff;
// }

// export function applyDiff<T extends Diffable>(beforeObj: T, diff: DiffType<T>): T {
//   const afterLines = makeIntoLines(beforeObj);
//
//   for (const diffPart of diff) {
//     if (diffPart.removeLines !== undefined) {
//       afterLines.splice(diffPart.afterPos, diffPart.removeLines.length);
//     }
//     if (diffPart.insertLines !== undefined) {
//       afterLines.splice(diffPart.afterPos, 0, ...diffPart.insertLines);
//     }
//   }
//
//   return JSON.parse(afterLines.join("\n"));
// }
//
// export function undoDiff<T extends Diffable>(afterObj: T, diff: DiffType<T>): T {
//   const beforeLines = makeIntoLines(afterObj);
//
//   for (const diffPart of diff) {
//     if (diffPart.insertLines !== undefined) {
//       beforeLines.splice(diffPart.beforePos, diffPart.insertLines.length);
//     }
//     if (diffPart.removeLines !== undefined) {
//       beforeLines.splice(diffPart.beforePos, 0, ...diffPart.removeLines)
//     }
//   }
//
//   return JSON.parse(beforeLines.join("\n"));
// }

interface OldSimpleDiffRecord<T extends Diffable> {
  before: T;
  after: T;
}

interface OldObjectDiffRecord<T extends DiffableObject> {
  added?: Partial<{
    [key in keyof T]: T[key];
  }>;
  removed?: Partial<{
    [key in keyof T]: T[key];
  }>;
  changed?: Partial<{
    [key in keyof T]: T[key] extends DiffableObject ? OldObjectDiffRecord<T[key]> : OldSimpleDiffRecord<T[key]>;
  }>;
}

export function undoDiff<T extends Diffable>(
  after: T,
  diff: null | (T extends DiffableObject ? OldObjectDiffRecord<T> : OldSimpleDiffRecord<T>),
): T {
  if (diff === null) return JSON.parse(JSON.stringify(after));

  if ((diff as any).after !== undefined) {
    return JSON.parse(JSON.stringify((diff as any).before)) as T;
  } else {
    return oldUndoObjectDiff(after as DiffableObject, diff as OldObjectDiffRecord<DiffableObject>) as T;
  }
}

function oldUndoObjectDiff<T extends DiffableObject>(
  after: T,
  diff: OldObjectDiffRecord<T>,
): T {
  const before: T = JSON.parse(JSON.stringify(after));
  if (diff.added !== undefined) for (const addedKey in diff.added) {
    delete before[addedKey];
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

export function applyDiff<T extends Diffable>(
  before: T,
  diff: null | (T extends DiffableObject ? OldObjectDiffRecord<T> : OldSimpleDiffRecord<T>),
): T {
  if (diff === null) return JSON.parse(JSON.stringify(before));

  if ((diff as any).after !== undefined) {
    return JSON.parse(JSON.stringify((diff as any).after)) as T;
  } else {
    return oldApplyObjectDiff(before as DiffableObject, diff as OldObjectDiffRecord<DiffableObject>) as T;
  }
}

function oldApplyObjectDiff<T extends DiffableObject>(
  before: T,
  diff: OldObjectDiffRecord<T>,
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

export type DiffType<T extends Diffable> =
  null | (T extends DiffableObject ? OldObjectDiffRecord<T> : OldSimpleDiffRecord<T>);

export function createDiff<T extends Diffable>(
  before: T,
  after: T,
): DiffType<T> {
  if (typeof before === "object" && typeof after === "object" && before !== null && after !== null) {
    return oldCreateObjectDiff(
      before as DiffableObject,
      after as DiffableObject,
    ) as T extends DiffableObject ? OldObjectDiffRecord<T> : OldSimpleDiffRecord<T>;
  } else {
    const beforeStr = JSON.stringify(before);
    const afterStr = JSON.stringify(after);

    if (beforeStr === afterStr) return null;

    return {
      before: JSON.parse(beforeStr),
      after: JSON.parse(afterStr),
    } as T extends DiffableObject ? OldObjectDiffRecord<T> : OldSimpleDiffRecord<T>;
  }
}

function oldCreateObjectDiff<T extends DiffableObject>(
  before: T,
  after: T,
): OldObjectDiffRecord<T> | null {
  let areIdentical = true;
  const objectDiff = {} as OldObjectDiffRecord<T>;

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
          OldObjectDiffRecord<T[typeof sharedKey]> :
          OldSimpleDiffRecord<T[typeof sharedKey]>;

      areIdentical = false;
    }
  }

  if (areIdentical) return null;
  else return objectDiff;
}
