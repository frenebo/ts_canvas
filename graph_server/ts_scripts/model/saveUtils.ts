import {
  IModelDataObj,
  ISessionData,
} from "./model.js";
import { SessionUtils } from "./sessionUtils.js";

export class SaveUtils {
  private static readonly saveFilePrefix = "GRAPH_FILE";

  public static savedFileNames(): string[] {
    return [];
    // const localStorageKeys = Object.keys(window.localStorage);
    //
    // const savedFileKeys = localStorageKeys.filter((key) => {
    //   return key.slice(0, SaveUtils.saveFilePrefix.length) === SaveUtils.saveFilePrefix;
    // });
    // const savedFileKeysWithoutPrefix = savedFileKeys.map((key) => key.slice(SaveUtils.saveFilePrefix.length));
    //
    // return savedFileKeysWithoutPrefix;
  }

  public static saveFile(fileName: string, session: ISessionData): void {
    // window.localStorage.setItem(
    //   `${SaveUtils.saveFilePrefix}${fileName}`,
    //   JSON.stringify(SessionUtils.toJson(session.data)),
    // );
  }

  public static openFile(fileName: string, session: ISessionData): void {
    // const dataStringOrNull = window.localStorage.getItem(`${SaveUtils.saveFilePrefix}${fileName}`);
    //
    // if (dataStringOrNull !== null) {
    //   const modelData: IModelDataObj = SessionUtils.fromJson(JSON.parse(dataStringOrNull));
    //
    //   // @TODO type checking?
    //   session.data = modelData;
    // }
  }

  public static deleteFile(fileName: string, session: ISessionData): void {
    // window.localStorage.removeItem(`${SaveUtils.saveFilePrefix}${fileName}`);
  }
}
