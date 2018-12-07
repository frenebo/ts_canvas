
type Cloneable = {
  [key: string]: Cloneable;
}  | number | string | boolean;

abstract class AbstractValueWrapper<T, V extends {} & Cloneable> {
  private value: T;
  constructor(
    val: T,
    private readonly config: V,
    private readonly utils: Readonly<{
      validate(val: unknown, config: V): null | string;
      parse(str: string): T | null;
      stringify(val: T): string;
      compareEquals(val1: T, val2: T): boolean;
      factory(val: T, config: V): AbstractValueWrapper<T, V>;
    }>,
  ) {
    this.value = this.utils.parse(this.utils.stringify(val)) as T;
  }

  public getValue(): T {
    return this.utils.parse(this.utils.stringify(this.value)) as T;
  }
  public setValue(val: T): void {
    const validateMssg = this.utils.validate(val, this.config);
    if (validateMssg !== null) throw new Error(`Error validating value: ${validateMssg}`);

    this.value = this.utils.parse(this.utils.stringify(val)) as T;
  }
  public stringify(): string {
    return this.utils.stringify(this.value);
  }
  public setFromString(str: string): void {
    if (typeof str !== "string") throw new Error("Argument must be string");

    const parsed = this.utils.parse(str);
    if (parsed === null) throw new Error("Could not parse");

    this.setValue(parsed);
  }
  public validateValue(val: T): string | null {
    return this.utils.validate(val, this.config);
  }
  public validateString(str: string): string | null {
    if (typeof str !== "string") throw new Error("Argument must be string");

    const parsed = this.utils.parse(str);
    if (parsed === null) return `Could not process value "${str}"`;

    return this.utils.validate(parsed, this.config);
  }
  public compareTo(val: T): boolean {
    return this.utils.compareEquals(
      this.value,
      val,
    );
  }
  public compareToString(str: string): boolean {
    if (typeof str !== "string") throw new Error("Argument must be string");

    const parsed = this.utils.parse(str);
    if (parsed === null) throw new Error(`Could not parse string ${str}`);

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

export type ShapeWrapperConfig = Cloneable & {
  dimConstraints?: {
    type: "equals";
    value: number;
  } | {
    type: "bounds";
    min?: number;
    max?: number;
  };
}

export class ShapeWrapper extends AbstractValueWrapper<number[], ShapeWrapperConfig> {
  private static validate(val: unknown, config: ShapeWrapperConfig): string | null {
    if (!Array.isArray(val)) return "Value is not array";
    if (config.dimConstraints !== undefined) {
      if (config.dimConstraints.type === "equals") {
        if (val.length !== config.dimConstraints.value) {
          return `Dimension count must be ${config.dimConstraints.value}`;
        }
      } else if (config.dimConstraints.type === "bounds") {
        if (
          config.dimConstraints.min !== undefined &&
          val.length < config.dimConstraints.min
        ) return `Dimension count must be at least ${config.dimConstraints.min}`;
        if (
          config.dimConstraints.max !== undefined &&
          val.length > config.dimConstraints.max
        ) return `Dimension count cannot be more than ${config.dimConstraints.max}`;
      }
    }
    for (let i = 0; i < val.length; i++) {
      if (val[i] <= 0) return `Dimension ${i} is not positive`;
      if (!Number.isInteger(val[i])) return `Dimension ${i + 1} is not an integer`;
      if (!Number.isSafeInteger(val[i])) return `Dimension ${i + 1} is too large`
    }

    return null;
  }
  private static parse(str: string): number[] | null {
    if (str[0] !== "(") return null;
    if (str[str.length - 1] !== ")") return null;
    let trimmedDims = str.slice(1, str.length - 1).split(",").map((dimStr) => dimStr.trim());

    if (trimmedDims.length === 1 && trimmedDims[0] === "") trimmedDims = [];

    for (const trimmedDimStr of trimmedDims) {
      if (!/^\d+$/.test(trimmedDimStr)) return null;
    }

    return trimmedDims.map((dim) => parseInt(dim));
  }
  private static stringify(val: number[]): string {
    return `(${val.join(",")})`;
  }
  private static compareEquals(val1: number[], val2: number[]): boolean {
    if (val1.length !== val2.length) return false;

    for (let i = 0; i < val1.length; i++) {
      if (val1[i] !== val2[i]) return false;
    }
    return true;
  }

  constructor(val: number[], config: ShapeWrapperConfig = {}) {
    super(
      val,
      config,
      {
        validate: ShapeWrapper.validate,
        parse: ShapeWrapper.parse,
        stringify: ShapeWrapper.stringify,
        compareEquals: ShapeWrapper.compareEquals,
        factory: (val: number[], config: ShapeWrapperConfig) => new ShapeWrapper(val, config),
      },
    );
  }
}
