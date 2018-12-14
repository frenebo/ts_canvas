import { AbstractValueWrapper, CloneableConfig } from "./valueWrapper.js";

export type ShapeWrapperConfig = CloneableConfig & {
  dimConstraints?: {
    type: "equals";
    value: number;
  } | {
    type: "bounds";
    min?: number;
    max?: number;
  };
};

export class ShapeWrapper extends AbstractValueWrapper<number[], ShapeWrapperConfig> {
  private static validate(val: unknown, config: ShapeWrapperConfig): string | null {
    if (!Array.isArray(val)) {
      return "Value is not array of numbers";
    }
    for (const dim of val) {
      if (typeof dim !== "number") {
        return "Value is not an array of numbers";
      }
    }

    if (config.dimConstraints !== undefined) {
      if (config.dimConstraints.type === "equals") {
        if (val.length !== config.dimConstraints.value) {
          return `Dimension count must be ${config.dimConstraints.value}`;
        }
      } else if (config.dimConstraints.type === "bounds") {
        if (
          config.dimConstraints.min !== undefined &&
          val.length < config.dimConstraints.min
        ) {
          return `Dimension count must be at least ${config.dimConstraints.min}`;
        }
        if (
          config.dimConstraints.max !== undefined &&
          val.length > config.dimConstraints.max
        ) {
          return `Dimension count cannot be more than ${config.dimConstraints.max}`;
        }
      }
    }
    for (let i = 0; i < val.length; i++) {
      if (val[i] <= 0) {
        return `Dimension ${i} is not positive`;
      }
      if (!Number.isInteger(val[i])) {
        return `Dimension #${i + 1} is not an integer`;
      }
      if (!Number.isSafeInteger(val[i])) {
        return `Dimension #${i + 1} is too large`;
      }
    }

    return null;
  }
  private static parse(str: string): number[] | null {
    if (str[0] !== "(") {
      return null;
    }
    if (str[str.length - 1] !== ")") {
      return null;
    }
    let trimmedDims = str.slice(1, str.length - 1).split(",").map((dimStr) => dimStr.trim());

    if (trimmedDims.length === 1 && trimmedDims[0] === "") {
      trimmedDims = [];
    }

    for (const trimmedDimStr of trimmedDims) {
      // optional plus/minus, 0 or more spaces, series of digits
      if (!/^[+\-]? *(?:\d+(?:\.\d*)?|\.\d+)$/.test(trimmedDimStr)) {
        return null;
      }
    }

    return trimmedDims.map((dim) => parseInt(dim));
  }
  private static stringify(val: number[]): string {
    return `(${val.join(",")})`;
  }
  private static copyValue(val: number[]): number[] {
    return val.slice();
  }
  private static compareEquals(val1: number[], val2: number[]): boolean {
    if (val1.length !== val2.length) {
      return false;
    }

    for (let i = 0; i < val1.length; i++) {
      if (val1[i] !== val2[i]) {
        return false;
      }
    }
    return true;
  }

  constructor(val: number[], config: ShapeWrapperConfig = {}) {
    super(
      val,
      config,
      {
        copyValue: ShapeWrapper.copyValue,
        compareEquals: ShapeWrapper.compareEquals,
        factory: (factoryVal: number[], factoryConfig: ShapeWrapperConfig) => {
          return new ShapeWrapper(factoryVal, factoryConfig);
        },
        parse: ShapeWrapper.parse,
        stringify: ShapeWrapper.stringify,
        validate: ShapeWrapper.validate,
      },
    );
  }
}
