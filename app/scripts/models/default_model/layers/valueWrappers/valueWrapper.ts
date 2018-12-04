
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
    const parsed = this.utils.parse(str);
    if (parsed === null) throw new Error("Could not parse");

    this.setValue(parsed);
  }
  public validateValue(val: T): string | null {
    return this.utils.validate(val, this.config);
  }
  public validateString(str: string): string | null {
    const parsed = this.utils.parse(str);
    if (parsed === null) return `Could not process value "${str}"`;

    return this.utils.validate(parsed, this.config);
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
      if (!Number.isInteger(val[i])) return `Dimension ${i} is not an integer`;
      if (!Number.isSafeInteger(val[i])) return `Dimension ${i} is too large`
    }

    return null;
  }
  private static parse(str: string): number[] {
    return str.replace("(", "").replace(")", "").split(",").map((dimStr) => parseInt(dimStr));
  }
  private static stringify(val: number[]): string {
    return `(${val.join(",")})`;
  }
  constructor(val: number[], config: ShapeWrapperConfig = {}) {
    super(
      val,
      config,
      {
        validate: ShapeWrapper.validate,
        parse: ShapeWrapper.parse,
        stringify: ShapeWrapper.stringify,
        factory: (val: number[], config: ShapeWrapperConfig) => new ShapeWrapper(val, config),
      },
    );
  }
}
