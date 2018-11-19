
export class DragRegistry {
  private locked: boolean;
  constructor() {
    this.locked = false;
  }

  public isLocked(): boolean {
    return this.locked;
  }

  public lock(): void {
    this.locked = true;
  }

  public unlock(): void {
    this.locked = false;
  }
}
