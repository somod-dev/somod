import { createFiles, createTempDir, deleteDir } from "@sodev/test-utils";
import { readFile } from "fs/promises";
import { dump } from "js-yaml";
import { join } from "path";
import { validateSchema } from "../../../../src/tasks/serverless/validateSchema";
import { buildTemplateYaml } from "../../../../src/utils/serverless/buildTemplateYaml";
import {
  doublePackageJson,
  functionDefaults,
  installSchemaInTempDir,
  moduleIndicators,
  singlePackageJson,
  StringifyTemplate
} from "../utils";

describe("test keyword SLP::DependsOn", () => {
  let dir: string = null;
  let buildTemplateJsonPath = null;

  beforeEach(async () => {
    dir = createTempDir();
    buildTemplateJsonPath = join(dir, "build", "serverless", "template.json");
    await installSchemaInTempDir(dir);
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("with SLP::DependsOn without module", async () => {
    const template = {
      Resources: {
        Resource1: {
          Type: "AWS::Serverless::Function",
          Properties: { ...functionDefaults },
          "SLP::DependsOn": [
            {
              module: "@my-scope/sample2",
              resource: "Resource2"
            }
          ]
        }
      }
    };
    createFiles(dir, {
      "serverless/template.yaml": dump(template),
      ...singlePackageJson
    });
    await validateSchema(dir); // make sure schema is right
    await expect(
      buildTemplateYaml(dir, moduleIndicators)
    ).rejects.toMatchObject({
      message: expect.stringContaining(
        "Dependent module resource {@my-scope/sample2, Resource2} not found. Depended from {@my-scope/sample, Resource1}"
      )
    });
  });

  test("with SLP::DependsOn and with module but no resource", async () => {
    const template = {
      Resources: {
        Resource1: {
          Type: "AWS::Serverless::Function",
          Properties: { ...functionDefaults },
          "SLP::DependsOn": [
            {
              module: "@my-scope/sample2",
              resource: "Resource2"
            }
          ]
        }
      }
    };
    createFiles(dir, {
      "serverless/template.yaml": dump(template),
      ...doublePackageJson,
      "node_modules/@my-scope/sample2/build/serverless/template.json":
        JSON.stringify({
          Resources: {
            Resource3: {
              Type: "AWS::Serverless::Function",
              Properties: { ...functionDefaults }
            }
          }
        })
    });
    await validateSchema(dir); // make sure schema is right
    await expect(
      buildTemplateYaml(dir, moduleIndicators)
    ).rejects.toMatchObject({
      message: expect.stringContaining(
        "Dependent module resource {@my-scope/sample2, Resource2} not found. Depended from {@my-scope/sample, Resource1}"
      )
    });
  });

  test("with SLP::DependsOn and with valid module and resource", async () => {
    const template = {
      Resources: {
        Resource1: {
          Type: "AWS::Serverless::Function",
          Properties: {
            ...functionDefaults
          },
          "SLP::DependsOn": [
            {
              module: "@my-scope/sample2",
              resource: "Resource2"
            }
          ]
        }
      }
    };
    createFiles(dir, {
      "serverless/template.yaml": dump(template),
      "serverless/functions/resource1.ts": "",
      ...doublePackageJson,
      "node_modules/@my-scope/sample2/build/serverless/template.json":
        JSON.stringify({
          Resources: {
            Resource2: {
              Type: "AWS::Serverless::Api",
              Properties: {
                Name: {
                  "SLP::ResourceName": "Resource2Api"
                }
              }
            }
          }
        })
    });
    await validateSchema(dir); // make sure schema is right
    await expect(
      buildTemplateYaml(dir, moduleIndicators)
    ).resolves.toBeUndefined();
    await expect(
      readFile(buildTemplateJsonPath, { encoding: "utf8" })
    ).resolves.toEqual(StringifyTemplate(template));
  });
});
