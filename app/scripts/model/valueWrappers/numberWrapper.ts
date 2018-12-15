import { AbstractValueWrapper, CloneableConfig } from "./valueWrapper.js";

export type NumberWrapperConfig = CloneableConfig & {
  requireInteger?: boolean;
  lowerBound?: {
    inclusive: boolean;
    val: number;
  };
  upperBound?: {
    inclusive: boolean;
    val: number;
  };
};

export class NumberWrapper extends AbstractValueWrapper<number, NumberWrapperConfig> {
  private static validate(val: unknown, config: NumberWrapperConfig): string | null {
    if (typeof val !== "number") {
      return "Value must be a number";
    }
    if (isNaN(val)) {
      return "Value must be a number";
    }
    if (Math.abs(val) >= Number.MAX_SAFE_INTEGER) {
      return "Value too large";
    }
    if (config.requireInteger === true && !Number.isInteger(val)) {
      return "Value must be an integer"
    }

    if (config.lowerBound !== undefined) {
      if (config.lowerBound.inclusive && val < config.lowerBound.val) {
        return `Value must be at least ${config.lowerBound.val}`;
      }
      if (!config.lowerBound.inclusive && val <= config.lowerBound.val) {
        return `Value must be more than ${config.lowerBound.val}`;
      }
    }

    if (config.upperBound !== undefined) {
      if (config.upperBound.inclusive && val > config.upperBound.val) {
        return `Value must be no more than ${config.upperBound.val}`;
      }
      if (!config.upperBound.inclusive && val >= config.upperBound.val) {
        return `Value must be less than ${config.upperBound.val}`;
      }
    }

    return null;
  }
  private static parse(str: string): number | null {
    const trimmed = str.trim();
    if (!/^[+\-]? *(?:\d+(?:\.\d*)?|\.\d+)$/.test(trimmed)) {
      return null;
    }

    return parseFloat(str);
  }
  private static stringify(val: number): string {
    if (isNaN(val)) {
      throw new Error("Val is not a number");
    }

    return val.toString();
  }
  private static compareEquals(val1: number, val2: number): boolean {
    return val1 === val2;
  }
  private static copyValue(val: number): number {
    return val;
  }

  constructor(val: number, config: NumberWrapperConfig = {}) {
    super(
      val,
      config,
      {
        copyValue: NumberWrapper.copyValue,
        compareEquals: NumberWrapper.compareEquals,
        factory: (factoryVal: number, factoryConfig: NumberWrapperConfig) => {
          return new NumberWrapper(factoryVal, factoryConfig);
        },
        parse: NumberWrapper.parse,
        stringify: NumberWrapper.stringify,
        validate: NumberWrapper.validate,
      },
    );
  }
}
