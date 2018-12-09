
export class VersioningManager<T> {
  private currentVal: string;
  private pastVals: string[] = [];
  private futureVals: string[] = [];

  private openFileName: string | null = null;
  private historyPositionFromSave: number | null = null;

  constructor(val: T) {
    this.currentVal = JSON.stringify(val);
  }

  public recordChange(val: T) {
    this.futureVals = [];
    this.pastVals.push(this.currentVal);
    this.currentVal = JSON.stringify(val);
    if (typeof this.historyPositionFromSave === "number") {
      if (this.historyPositionFromSave < 0) {
        this.historyPositionFromSave = null;
      } else {
        this.historyPositionFromSave++;
      }
    }
  }

  public undo(): T {
    const pastVal = this.pastVals.pop();
    if (pastVal !== undefined) {
      this.futureVals.splice(0, 0, this.currentVal);
      this.currentVal = pastVal;
      if (this.historyPositionFromSave !== null) {
        this.historyPositionFromSave--;
      }
    }

    return JSON.parse(this.currentVal);
  }

  public redo(): T {
    if (this.futureVals.length !== 0) {
      this.pastVals.push(this.currentVal);
      this.currentVal = this.futureVals.splice(0, 1)[0];
      if (this.historyPositionFromSave !== null) {
        this.historyPositionFromSave++;
      }
    }

    return JSON.parse(this.currentVal);
  }

  public onFileOpen(fileName: string, newVal: T): void {
    this.openFileName = fileName;
    this.historyPositionFromSave = 0;
    this.currentVal = JSON.stringify(newVal);
    this.pastVals = [];
    this.futureVals = [];
  }

  public onFileSave(fileName: string): void {
    this.openFileName = fileName;
    this.historyPositionFromSave = 0;
  }

  public onFileDelete(fileName: string): void {
    if (fileName === this.openFileName) {
      this.openFileName = null;
      this.historyPositionFromSave = null;
    }
  }

  public areAllChangesSaved(): boolean {
    return this.openFileName !== null && this.historyPositionFromSave === 0;
  }

  public getOpenFileName(): string | null {
    return this.openFileName;
  }
}
