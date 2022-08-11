import { JSONSchema7, getCompiledValidator } from "@solib/json-validator";
import { difference } from "lodash";

export type FilterFunction = (ip: unknown) => unknown | Promise<unknown>;

export class Filter {
  private static filter: Filter;

  private filters: Record<string, FilterFunction> = {};

  private constructor() {
    // dont do anything
  }

  public static getFilter() {
    if (!this.filter) {
      this.filter = new Filter();
      this.filter.register("ajvStandalone", ajvStandalone);
      this.filter.register("jsonParse", jsonParse);
      this.filter.register("jsonStringify", jsonStringify);
    }
    return this.filter;
  }

  public register(name: string, fn: FilterFunction) {
    this.filters[name] = fn;
  }

  public async apply(ip: unknown, filterNames: string[]): Promise<unknown> {
    const registeredFilterNames = Object.keys(this.filters);
    const unknownFilterNames = difference(filterNames, registeredFilterNames);
    if (unknownFilterNames.length > 0) {
      throw new Error(
        `Unknown Parameters filters (${unknownFilterNames.join(", ")})`
      );
    }

    let intermediate = ip;
    for (const filterName of filterNames) {
      const result = this.filters[filterName](intermediate);
      intermediate =
        result && typeof (result as Promise<unknown>).then == "function"
          ? await result
          : result;
    }

    return intermediate;
  }
}

export const ajvStandalone = (schema: JSONSchema7) => {
  return getCompiledValidator(schema);
};

export const jsonParse = (json: string) => {
  return JSON.parse(json);
};

export const jsonStringify = (json: unknown) => {
  return JSON.stringify(json);
};
