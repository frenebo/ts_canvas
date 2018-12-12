import { AbstractValueWrapper, CloneableConfig } from "./valueWrapper.js";

export type NumberWrapperConfig = CloneableConfig & {

};

export class NumberWrapper extends AbstractValueWrapper<number, NumberWrapperConfig> {
  private static validate(val: unknown): string | null {
    if (typeof val !== "number") {
      return "Value is not a number";
    }
    if (isNaN(val)) {
      return "Value is not a number";
    }
    if (Math.abs(val) >= Number.MAX_SAFE_INTEGER) {
      return "Value too large";
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

  constructor(val: number, config: NumberWrapperConfig = {}) {
    super(
      val,
      config,
      {
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
