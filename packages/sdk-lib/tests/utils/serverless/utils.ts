import { copyDirectory } from "@sodev/test-utils";
import { join } from "path";

export const installSchemaInTempDir = async (dir: string) => {
  const schemaPackage = join(__dirname, "../../../../serverless-schema");
  const schemaPackageInTempDir = join(
    dir,
    "node_modules/@somod/serverless-schema"
  );
  await copyDirectory(
    join(schemaPackage, "meta-schemas"),
    join(schemaPackageInTempDir, "meta-schemas")
  );
  await copyDirectory(
    join(schemaPackage, "schemas"),
    join(schemaPackageInTempDir, "schemas")
  );
};

export const functionDefaults = {
  Architectures: ["arm64"],
  InlineCode: ""
};

export const singlePackageJson = {
  "package.json": JSON.stringify({
    name: "@my-scope/sample",
    version: "1.0.0",
    dependencies: {},
    slp: "1.3.2"
  })
};

export const doublePackageJson = {
  "package.json": JSON.stringify({
    name: "@my-scope/sample",
    version: "1.0.0",
    dependencies: { "@my-scope/sample2": "^1.0.0" },
    slp: "1.3.2"
  }),
  "node_modules/@my-scope/sample2/package.json": JSON.stringify({
    name: "@my-scope/sample2",
    version: "1.0.0",
    dependencies: {},
    slp: "1.3.2"
  })
};

export const StringifyTemplate = (json: unknown): string => {
  return JSON.stringify(json);
};

export const moduleIndicators = ["slp"];
