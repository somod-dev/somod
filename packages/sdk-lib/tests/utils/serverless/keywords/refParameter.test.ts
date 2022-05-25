import { createFiles, createTempDir, deleteDir } from "@sodev/test-utils";
import { readFile } from "fs/promises";
import { dump } from "js-yaml";
import { join } from "path";
import { validateSchema } from "../../../../src/tasks/serverless/validateSchema";
import { buildTemplateJson } from "../../../../src/utils/serverless";
import {
  doublePackageJson,
  functionDefaults,
  installSchemaInTempDir,
  moduleIndicators,
  singlePackageJson,
  StringifyTemplate
} from "../utils";

describe("test keyword SLP::RefParameter", () => {
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

  test("with SLP::RefParameter without module", async () => {
    const template = {
      Resources: {
        Resource1: {
          Type: "AWS::Serverless::Function",
          Properties: {
            ...functionDefaults,
            Timeout: {
              "SLP::RefParameter": {
                parameter: "timeout",
                module: "@my-scope/sample2"
              }
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
    await expect(
      buildTemplateJson(dir, moduleIndicators)
    ).rejects.toMatchObject({
      message: expect.stringContaining(
        'Referenced module parameter {@my-scope/sample2, timeout} not found. Referenced in "@my-scope/sample" at "Resources/Resource1/Properties/Timeout"'
      )
    });
  });

  test("with SLP::RefParameter and with module but no Parameters section", async () => {
    const template = {
      Resources: {
        Resource1: {
          Type: "AWS::Serverless::Function",
          Properties: {
            ...functionDefaults,
            Timeout: {
              "SLP::RefParameter": {
                parameter: "timeout",
                module: "@my-scope/sample2"
              }
            }
          }
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
      buildTemplateJson(dir, moduleIndicators)
    ).rejects.toMatchObject({
      message: expect.stringContaining(
        'Referenced module parameter {@my-scope/sample2, timeout} not found. Referenced in "@my-scope/sample" at "Resources/Resource1/Properties/Timeout"'
      )
    });
  });

  test("with SLP::RefParameter and with module but no Parameter", async () => {
    const template = {
      Resources: {
        Resource1: {
          Type: "AWS::Serverless::Function",
          Properties: {
            ...functionDefaults,
            Timeout: {
              "SLP::RefParameter": {
                parameter: "timeout",
                module: "@my-scope/sample2"
              }
            }
          }
        }
      }
    };
    createFiles(dir, {
      "serverless/template.yaml": dump(template),
      ...doublePackageJson,
      "node_modules/@my-scope/sample2/build/serverless/template.json":
        JSON.stringify({
          Parameters: {},
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
      buildTemplateJson(dir, moduleIndicators)
    ).rejects.toMatchObject({
      message: expect.stringContaining(
        'Referenced module parameter {@my-scope/sample2, timeout} not found. Referenced in "@my-scope/sample" at "Resources/Resource1/Properties/Timeout"'
      )
    });
  });

  test("with SLP::RefParameter and with valid module and parameter", async () => {
    const template = {
      Resources: {
        Resource1: {
          Type: "AWS::Serverless::Function",
          Properties: {
            ...functionDefaults,
            Timeout: {
              "SLP::RefParameter": {
                parameter: "timeout",
                module: "@my-scope/sample2"
              }
            }
          }
        }
      }
    };
    createFiles(dir, {
      "serverless/template.yaml": dump(template),
      ...doublePackageJson,
      "node_modules/@my-scope/sample2/build/serverless/template.json":
        JSON.stringify({
          Parameters: {
            timeout: {
              SAMType: "String",
              schema: {
                type: "string",
                maxLength: 32
              }
            }
          },
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
      buildTemplateJson(dir, moduleIndicators)
    ).resolves.toBeUndefined();
    await expect(
      readFile(buildTemplateJsonPath, { encoding: "utf8" })
    ).resolves.toEqual(StringifyTemplate(template));
  });

  test("with SLP::RefParameter local parameter", async () => {
    const template = {
      Parameters: {
        timeout: {
          SAMType: "String",
          schema: {
            type: "string",
            maxLength: 32
          }
        }
      },
      Resources: {
        Resource1: {
          Type: "AWS::Serverless::Function",
          Properties: {
            ...functionDefaults,
            Timeout: {
              "SLP::RefParameter": {
                parameter: "timeout"
              }
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
    await expect(
      buildTemplateJson(dir, moduleIndicators)
    ).resolves.toBeUndefined();
    await expect(
      readFile(buildTemplateJsonPath, { encoding: "utf8" })
    ).resolves.toEqual(StringifyTemplate(template));
  });
});
