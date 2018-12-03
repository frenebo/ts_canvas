import { ModelDataObj, ModelAndDiffs } from "./model";

export class SaveUtils {
  private static saveFilePrefix = "GRAPH_FILE";
  public static savedFileNames(): string[] {
    const localStorageKeys = Object.keys(window.localStorage);

    const savedFileKeys = localStorageKeys.filter(key => {
      return key.slice(0, SaveUtils.saveFilePrefix.length) === SaveUtils.saveFilePrefix;
    });
    const savedFileKeysWithoutPrefix = savedFileKeys.map(key => key.slice(SaveUtils.saveFilePrefix.length));

    return savedFileKeysWithoutPrefix;
  }

  public static saveFile(fileName: string, data: ModelAndDiffs): void {
    window.localStorage.setItem(`${SaveUtils.saveFilePrefix}${fileName}`, JSON.stringify(data));
  }

  public static openFile(fileName: string): ModelAndDiffs | null {
    const dataStringOrNull = window.localStorage.getItem(`${SaveUtils.saveFilePrefix}${fileName}`);

    if (dataStringOrNull === null) {
      return null;
    } else {
      return JSON.parse(dataStringOrNull);
    }
  }

  public static deleteFile(fileName: string): void {
    window.localStorage.removeItem(`${SaveUtils.saveFilePrefix}${fileName}`);
  }
}
