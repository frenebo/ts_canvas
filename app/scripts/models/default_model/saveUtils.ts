import {
  ModelDataObj,
  SessionData
} from "./model.js";
import { SessionUtils } from "./sessionUtils.js";

export class SaveUtils {
  private static readonly saveFilePrefix = "GRAPH_FILE";

  public static savedFileNames(): string[] {
    const localStorageKeys = Object.keys(window.localStorage);

    const savedFileKeys = localStorageKeys.filter((key) => {
      return key.slice(0, SaveUtils.saveFilePrefix.length) === SaveUtils.saveFilePrefix;
    });
    const savedFileKeysWithoutPrefix = savedFileKeys.map((key) => key.slice(SaveUtils.saveFilePrefix.length));

    return savedFileKeysWithoutPrefix;
  }

  public static saveFile(fileName: string, session: SessionData): void {
    window.localStorage.setItem(`${SaveUtils.saveFilePrefix}${fileName}`, JSON.stringify(SessionUtils.toJson(session.data)));
    session.openFile = {
      fileName: fileName,
      fileIdxInHistory: 0,
    }
  }

  public static openFile(fileName: string, session: SessionData): void {
    const dataStringOrNull = window.localStorage.getItem(`${SaveUtils.saveFilePrefix}${fileName}`);

    if (dataStringOrNull !== null) {
      const modelData: ModelDataObj = SessionUtils.fromJson(JSON.parse(dataStringOrNull));

      // @TODO type checking?
      session.data = modelData;
      session.openFile = {
        fileName: fileName,
        fileIdxInHistory: 0,
      };
    }
  }

  public static deleteFile(fileName: string, session: SessionData): void {
    window.localStorage.removeItem(`${SaveUtils.saveFilePrefix}${fileName}`);

    if (session.openFile !== null && session.openFile.fileName === fileName) {
      session.openFile = null;
    }
  }
}
