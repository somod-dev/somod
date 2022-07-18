import { createFiles, createTempDir, deleteDir } from "@sodev/test-utils";
import { readFile } from "fs/promises";
import { dump } from "js-yaml";
import { join } from "path";
import { validateSchema } from "../../../../src/tasks/serverless/validateSchema";
import { buildTemplateYaml } from "../../../../src/utils/serverless/buildTemplateYaml";
import {
  doublePackageJson,
  installSchemaInTempDir,
  singlePackageJson,
  StringifyTemplate
} from "../utils";

describe("test keyword SOMOD::ResourceName", () => {
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

  test("with SOMOD::ResourceName", async () => {
    const template = {
      Resources: {
        Resource1: {
          Type: "AWS::DynamoDB::Table",
          Properties: {
            TableName: {
              "SOMOD::ResourceName": "Resource1"
            }
          }
        }
      }
    };
    createFiles(dir, {
      "serverless/template.yaml": dump(template),
      ...singlePackageJson
    });
    await validateSchema(dir); // make sure schema is right
    await expect(buildTemplateYaml(dir)).resolves.toBeUndefined();
    await expect(
      readFile(buildTemplateJsonPath, { encoding: "utf8" })
    ).resolves.toEqual(StringifyTemplate(template));
  });

  test("with SOMOD::ResourceName on extended resource", async () => {
    const template = {
      Resources: {
        Resource1: {
          Type: "AWS::DynamoDB::Table",
          "SOMOD::Extend": {
            module: "@my-scope/sample2",
            resource: "Resource2"
          },
          Properties: {
            TableName: {
              "SOMOD::ResourceName": "Resource1"
            }
          }
        }
      }
    };
    createFiles(dir, {
      "serverless/template.yaml": dump(template),
      "node_modules/@my-scope/sample2/build/serverless/template.json":
        JSON.stringify({
          Resources: {
            Resource2: {
              Type: "AWS::DynamoDB::Table",
              Properties: {}
            }
          }
        }),
      ...doublePackageJson
    });
    await validateSchema(dir); // make sure schema is right
    await expect(buildTemplateYaml(dir)).resolves.toBeUndefined();
  });
});
