import { ModelDataObj } from "./model";

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

  public static saveFile(fileName: string, data: ModelDataObj): void {
    window.localStorage.setItem(`${SaveUtils.saveFilePrefix}${fileName}`, JSON.stringify(data));
  }

  public static openFile(fileName: string): ModelDataObj | null {
    const dataStringOrNull = window.localStorage.getItem(`${SaveUtils.saveFilePrefix}${fileName}`);

    if (dataStringOrNull === null) {
      return null;
    } else {
      const modelData: ModelDataObj = JSON.parse(dataStringOrNull);

      // @TODO type checking?

      return modelData;
    }
  }

  public static deleteFile(fileName: string): void {
    window.localStorage.removeItem(`${SaveUtils.saveFilePrefix}${fileName}`);
  }
}
