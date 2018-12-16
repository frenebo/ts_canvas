import { UNDO_HISTORY_SIZE } from "../constants.js";

export class VersioningManager<T> {
  private currentVal!: string;
  private currentVersionId!: string;
  private valsByVersion: {[key: string]: string} = {};
  private pastVals: string[] = [];
  private futureVals: string[] = [];

  private openFileName: string | null = null;
  private historyPositionFromSave: number | null = null;

  constructor(val: T) {
    this.setCurrent(val);
  }

  private registerNewVersionId(): string {
    let randomVal = Math.random();
    let multiplier = 10;
    while (this.valsByVersion[Math.floor(randomVal*multiplier).toString()] !== undefined) {
      multiplier *= 10;
    }
    const versionId = Math.floor(randomVal*multiplier).toString();
    return versionId;
  }

  private setCurrent(val: T): void {
    const versionId = this.registerNewVersionId();
    this.currentVal = JSON.stringify(val);
    this.currentVersionId = versionId;
    this.valsByVersion[versionId] = this.currentVal; // string
  }

  public recordChange(val: T) {
    this.futureVals = [];
    this.pastVals.push(this.currentVal);
    if (this.pastVals.length > UNDO_HISTORY_SIZE) {
      this.pastVals.splice(0, 1);
    }
    this.setCurrent(val);
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
    this.setCurrent(newVal);
    this.pastVals = [];
    this.futureVals = [];
  }

  public onFileSave(fileName: string): void {
    this.openFileName = fileName;
    this.historyPositionFromSave = 0;
  }

  public getValByVersionId(versionId: string): T {
    return JSON.parse(this.valsByVersion[versionId]);
  }

  public getCurrentVersionId(): string {
    return this.currentVersionId;
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
