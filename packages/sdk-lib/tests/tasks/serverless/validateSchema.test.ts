import { copyDirectory } from "@solib/cli-base";
import { dump } from "js-yaml";
import { join } from "path";
import { validateServerlessTemplateWithSchema } from "../../../src";
import { createFiles, createTempDir, deleteDir } from "../../utils";

const installSchemaInTempDir = async (dir: string) => {
  const schemaPackage = join(__dirname, "../../../../schema/serverless");
  const schemaPackageInTempDir = join(
    dir,
    "node_modules/@somod/schema/serverless"
  );
  await copyDirectory(
    join(schemaPackage, "schemas"),
    join(schemaPackageInTempDir, "schemas")
  );
};

describe("Test Task validateServerlessTemplateWithSchema", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("For no serverless directory", async () => {
    createFiles(dir, {
      "package.json": JSON.stringify({ name: "sample" })
    });
    await expect(
      validateServerlessTemplateWithSchema(dir)
    ).resolves.toBeUndefined();
  });

  test("For no template", async () => {
    createFiles(dir, {
      "package.json": JSON.stringify({ name: "sample" }),
      "serverless/": ""
    });
    await expect(
      validateServerlessTemplateWithSchema(dir)
    ).resolves.toBeUndefined();
  });

  test("For empty template", async () => {
    createFiles(dir, {
      "package.json": JSON.stringify({ name: "sample" }),
      "serverless/template.yaml": ""
    });
    await installSchemaInTempDir(dir);
    await expect(validateServerlessTemplateWithSchema(dir)).rejects.toEqual(
      new Error(
        join(dir, "serverless/template.yaml") +
          " has following errors\n must be object"
      )
    );
  });

  test("For template with empty Resources", async () => {
    createFiles(dir, {
      "package.json": JSON.stringify({ name: "sample" }),
      "serverless/template.yaml": "Resources:\n  "
    });
    await installSchemaInTempDir(dir);
    await expect(validateServerlessTemplateWithSchema(dir)).rejects.toEqual(
      new Error(
        join(dir, "serverless/template.yaml") +
          " has following errors\n Resources must be object"
      )
    );
  });

  test("For simple valid template", async () => {
    createFiles(dir, {
      "package.json": JSON.stringify({ name: "sample" }),
      "serverless/template.yaml": dump({
        Resources: {
          Resource1: {
            Type: "AWS::Serverless::Function",
            Properties: {
              Architectures: ["arm64"],
              CodeUri: { "SOMOD::Function": { name: "resource1" } }
            }
          }
        }
      })
    });
    await installSchemaInTempDir(dir);
    await expect(
      validateServerlessTemplateWithSchema(dir)
    ).resolves.toBeUndefined();
  });
});
