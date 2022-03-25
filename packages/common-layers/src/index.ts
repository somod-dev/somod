import { existsSync } from "fs";
import { dirname, join } from "path";

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace layerLibraries {
  export const base: string[] = [
    "@solib/json-validator",
    "@solib/common-types-schemas",
    "@solib/errors",
    "lodash",
    "tslib",
    "uuid"
  ];
  export const customResource: string[] = ["@solib/cfn-custom-resource"];
  export const httpWrapper: string[] = ["@solib/http-lambda"];
}

export const getLocation = async (): Promise<string> => {
  let location = __dirname;
  while (!existsSync(join(location, "package.json"))) {
    location = dirname(location);
  }
  return location;
};
