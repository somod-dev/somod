import { copyDirectory } from "@sodaru/cli-base";
import { dump } from "js-yaml";
import { join } from "path";
import { validateServerlessTemplateWithSchema } from "../../../src";
import { createFiles, createTempDir, deleteDir } from "../../utils";

const installSchemaInTempDir = async (dir: string) => {
  // Stage Setup -- START
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

describe("Test Task validateServerlessTemplateWithSchema", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("For no serverless directory", async () => {
    await expect(
      validateServerlessTemplateWithSchema(dir)
    ).resolves.toBeUndefined();
  });

  test("For no template", async () => {
    createFiles(dir, {
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
      new Error('"" must be object')
    );
  });

  test("For template with empty Resources", async () => {
    createFiles(dir, {
      "package.json": JSON.stringify({ name: "sample" }),
      "serverless/template.yaml": "Resources:\n  "
    });
    await installSchemaInTempDir(dir);
    await expect(validateServerlessTemplateWithSchema(dir)).rejects.toEqual(
      new Error('"/Resources" must be object')
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
              CodeUri: { "SLP::Function": "resource1" }
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
