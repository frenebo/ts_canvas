
export class SaveUtils {
  private static saveFilePrefix = "GRAPH_FILE";
  public static savedFileNames(): string[] {
    const localStorageKeys = Object.keys(window.localStorage);

    const savedFileKeys = localStorageKeys.filter(key => {
      return key.slice(0, SaveUtils.saveFilePrefix.length) === SaveUtils.saveFilePrefix;
    });
    const savedFileKeysWithoutPrefix = savedFileKeys.map(key => key.slice(SaveUtils.saveFilePrefix.length));

    // return savedFileKeysWithoutPrefix;
    const titles: string[] = [];
    for (let i = 0; i < 100; i++) titles.push(i.toString());

    return titles;
  }
}
