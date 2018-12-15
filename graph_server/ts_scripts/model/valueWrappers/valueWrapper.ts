
export type CloneableConfig = {
  [key: string]: CloneableConfig;
}  | number | string | boolean;

export abstract class AbstractValueWrapper<T, V extends {} & CloneableConfig> {
  private value: T;
  constructor(
    val: T,
    private readonly config: V,
    private readonly utils: {
      copyValue(val: T): T;
      validate(val: unknown, config: V): null | string;
      parse(str: string): T | null;
      stringify(val: T): string;
      compareEquals(val1: T, val2: T): boolean;
      factory(val: T, config: V): AbstractValueWrapper<T, V>;
    },
  ) {
    this.value = this.utils.copyValue(val);
  }

  public getValue(): T {
    return this.utils.copyValue(this.value);
  }
  public setValue(val: T): void {
    const validateMssg = this.utils.validate(val, this.config);
    if (validateMssg !== null) {
      throw new Error(`Error validating value: ${validateMssg}`);
    }

    this.value = this.utils.copyValue(val);
  }
  public stringify(): string {
    return this.utils.stringify(this.value);
  }
  public setFromString(str: string): void {
    if (typeof str !== "string") {
      throw new Error("Argument must be string");
    }

    const parsed = this.utils.parse(str);
    if (parsed === null) {
      throw new Error("Could not parse");
    }

    this.setValue(parsed);
  }
  public validateValue(val: unknown): string | null {
    return this.utils.validate(val, this.config);
  }
  public validateString(str: string): string | null {
    if (typeof str !== "string") {
      throw new Error("Argument must be string");
    }

    const parsed = this.utils.parse(str);
    if (parsed === null) {
      return `Could not process value "${str}"`;
    }

    return this.utils.validate(parsed, this.config);
  }
  public compareTo(val: T): boolean {
    return this.utils.compareEquals(
      this.value,
      val,
    );
  }
  public compareToString(str: string): boolean {
    if (typeof str !== "string") {
      throw new Error("Argument must be string");
    }

    const parsed = this.utils.parse(str);
    if (parsed === null) {
      throw new Error(`Could not parse string ${str}`);
    }

    return this.utils.compareEquals(
      this.value,
      parsed,
    );
  }
  public clone(): AbstractValueWrapper<T, V> {
    return this.utils.factory(
      this.value,
      JSON.parse(JSON.stringify(this.config)),
    );
  }
}

export type ValueWrapper = AbstractValueWrapper<unknown, {}>;
