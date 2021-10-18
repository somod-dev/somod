import { dump } from "js-yaml";
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
      "serverless/template.yaml": ""
    });
    await expect(validateServerlessTemplateWithSchema(dir)).rejects.toEqual(
      new Error('"" must be object')
    );
  });

  test("For template with empty Resources", async () => {
    createFiles(dir, {
      "serverless/template.yaml": "Resources:\n  "
    });
    await expect(validateServerlessTemplateWithSchema(dir)).rejects.toEqual(
      new Error('"/Resources" must be object')
    );
  });

  test("For template with invalid resource type", async () => {
    createFiles(dir, {
      "serverless/template.yaml": dump({
        Resources: { Resource1: { Type: "Abcd", Properties: {} } }
      })
    });
    await expect(
      validateServerlessTemplateWithSchema(dir)
    ).rejects.toMatchObject({
      message: expect.stringContaining(
        '"/Resources/Resource1/Type" must be equal to one of the allowed values'
      )
    });
  });

  test("For simple valid template", async () => {
    createFiles(dir, {
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
    await expect(
      validateServerlessTemplateWithSchema(dir)
    ).resolves.toBeUndefined();
  });
});
