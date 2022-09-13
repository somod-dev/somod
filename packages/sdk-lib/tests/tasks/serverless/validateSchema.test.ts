import { dump } from "js-yaml";
import { join } from "path";
import { validateServerlessTemplateWithSchema } from "../../../src";
import { createFiles, createTempDir, deleteDir } from "../../utils";

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
    await expect(
      validateServerlessTemplateWithSchema(dir)
    ).resolves.toBeUndefined();
  });
});
