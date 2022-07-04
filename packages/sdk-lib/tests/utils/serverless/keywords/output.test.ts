import { createFiles, createTempDir, deleteDir } from "@sodev/test-utils";
import { readFile } from "fs/promises";
import { dump } from "js-yaml";
import { join } from "path";
import { validateSchema } from "../../../../src/tasks/serverless/validateSchema";
import { buildTemplateYaml } from "../../../../src/utils/serverless/buildTemplateYaml";
import {
  functionDefaults,
  installSchemaInTempDir,
  moduleIndicators,
  singlePackageJson,
  StringifyTemplate
} from "../utils";

describe("test keyword SLP::Output", () => {
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

  test("with SLP::Output", async () => {
    const template = {
      Resources: {
        Resource1: {
          Type: "AWS::Serverless::Function",
          Properties: { ...functionDefaults },
          "SLP::Output": {
            default: true,
            attributes: []
          }
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
    ).resolves.toBeUndefined();
    await expect(
      readFile(buildTemplateJsonPath, { encoding: "utf8" })
    ).resolves.toEqual(StringifyTemplate(template));
  });

  test("with missing export parameter", async () => {
    const template = {
      Resources: {
        Resource1: {
          Type: "AWS::Serverless::Function",
          Properties: { ...functionDefaults },
          "SLP::Output": {
            default: true,
            attributes: ["Arn"],
            export: {
              default: "my.resource1.name",
              Arn: "my.var1"
            }
          }
        }
      }
    };
    createFiles(dir, {
      "parameters.yaml": dump({
        Parameters: {
          "my.var1": { type: "text", default: "1" },
          "my.var3": { type: "text", default: "3" }
        }
      }),
      "serverless/template.yaml": dump(template),
      ...singlePackageJson
    });
    await validateSchema(dir); // make sure schema is right
    await expect(buildTemplateYaml(dir, moduleIndicators)).rejects.toEqual(
      new Error(`Following export parameters referenced from 'serverless/template.yaml' are not found
 - my.resource1.name`)
    );
  });
});
