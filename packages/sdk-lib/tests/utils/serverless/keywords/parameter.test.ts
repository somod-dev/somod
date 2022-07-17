import { createFiles, createTempDir, deleteDir } from "@sodev/test-utils";
import { readFile } from "fs/promises";
import { dump } from "js-yaml";
import { join } from "path";
import { validateSchema } from "../../../../src/tasks/serverless/validateSchema";
import { buildTemplateYaml } from "../../../../src/utils/serverless/buildTemplateYaml";
import {
  functionDefaults,
  installSchemaInTempDir,
  singlePackageJson,
  StringifyTemplate
} from "../utils";

describe("test keyword SOMOD::Parameter", () => {
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

  test("with SOMOD::Parameter", async () => {
    const template = {
      Resources: {
        Resource1: {
          Type: "AWS::Serverless::Function",
          Properties: {
            ...functionDefaults,
            Environment: {
              Variables: {
                MY_VAR1: {
                  "SOMOD::Parameter": "my.var1"
                }
              }
            }
          }
        }
      }
    };
    createFiles(dir, {
      "parameters.yaml": dump({
        Parameters: { "my.var1": { type: "text", default: "1" } }
      }),
      "serverless/template.yaml": dump(template),
      ...singlePackageJson
    });
    await validateSchema(dir); // make sure schema is right
    await expect(buildTemplateYaml(dir)).resolves.toBeUndefined();
    await expect(
      readFile(buildTemplateJsonPath, { encoding: "utf8" })
    ).resolves.toEqual(StringifyTemplate(template));
  });

  test("with missing SOMOD::Parameter", async () => {
    const template = {
      Resources: {
        Resource1: {
          Type: "AWS::Serverless::Function",
          Properties: {
            ...functionDefaults,
            Environment: {
              Variables: {
                MY_VAR1: {
                  "SOMOD::Parameter": "my.var1"
                },
                MY_VAR2: {
                  "SOMOD::Parameter": "my.var2"
                }
              }
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
    await expect(buildTemplateYaml(dir)).rejects.toEqual(
      new Error(`Following parameters referenced from 'serverless/template.yaml' are not found
 - my.var2`)
    );
  });
});
