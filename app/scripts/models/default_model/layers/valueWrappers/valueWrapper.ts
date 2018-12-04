
export abstract class ValueWrapper<T> {
  constructor(
    private value: T,
  ) {
    // empty
  }

  public getValue(): T {
    return this.parse(this.stringify(this.value));
  }
  public setValue(val: T): void {
    this.value = this.parse(this.stringify(val));
  }

  protected abstract parse(str: string): T;
  protected abstract stringify(val: T): string;
}

export class ShapeWrapper extends ValueWrapper<number[]> {
  constructor(value: number[]) {
    super(value);
  }

  public stringify(val: number[]) {
    return `(${val.join(",")})`;
  }

  public parse(str: string) {
    const withoutParentheses = str.replace("(", "").replace(")", "");
    const dims = withoutParentheses.split(",").map((dimStr) => parseFloat(dimStr));
    return dims;
  }
}
