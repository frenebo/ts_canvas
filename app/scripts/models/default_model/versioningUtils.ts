import { SessionData, ModelDataObj } from "./model.js";
import { undoDiff, Diffable, applyDiff } from "../../diff.js";

export class VersioningUtils {
  public static undo(session: SessionData): void {
    if (session.pastDiffs.length === 0) return;
    const pastDiff = session.pastDiffs.pop()!;

    const newData = undoDiff(session.data as unknown as Diffable, pastDiff) as unknown as ModelDataObj;

    session.futureDiffs.splice(0, 0, pastDiff);

    session.data = newData;
    if (session.openFile !== null) {
      if (typeof session.openFile.fileIdxInHistory === "number") {
        session.openFile.fileIdxInHistory--;
      }
    }
  }

  public static redo(session: SessionData): void {
    if (session.futureDiffs.length === 0) return;
    const redoDiff = session.futureDiffs.splice(0, 1)[0];

    const newData = applyDiff(session.data as unknown as Diffable, redoDiff) as unknown as ModelDataObj;

    session.pastDiffs.push(redoDiff);

    session.data = newData;
    if (session.openFile !== null) {
      if (typeof session.openFile.fileIdxInHistory === "number") {
        session.openFile.fileIdxInHistory++;
      }
    }
  }
}
