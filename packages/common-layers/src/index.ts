import { existsSync } from "fs";
import { dirname, join } from "path";
import {
  AWSSAMRetentionPolicy,
  CommonLayers,
  ResourceAttributesType
} from "./types";

export * from "./types";

export const layerLibraries: Record<string, ResourceAttributesType> = {
  base: {
    name: CommonLayers.base,
    description: "Set of npm libraries to be required in all Lambda funtions",
    retentionPolicy: AWSSAMRetentionPolicy.Delete,
    libraries: [
      "@solib/json-validator",
      "@solib/common-types-schemas",
      "@solib/errors",
      "lodash",
      "tslib",
      "uuid"
    ]
  },
  customResource: {
    name: CommonLayers.customResource,
    description: "Wrapper libraries to create CloudFormation Custom Resource",
    retentionPolicy: AWSSAMRetentionPolicy.Delete,
    libraries: ["@solib/cfn-custom-resource"]
  },
  http: {
    name: CommonLayers.httpWrapper,
    description: "http wrapper Layer for lambda functions",
    retentionPolicy: AWSSAMRetentionPolicy.Delete,
    libraries: ["@solib/http-lambda"]
  }
};

export const getLocation = async (): Promise<string> => {
  let location = __dirname;
  while (!existsSync(join(location, "package.json"))) {
    location = dirname(location);
  }
  return location;
};
