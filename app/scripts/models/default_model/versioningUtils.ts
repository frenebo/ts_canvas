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
