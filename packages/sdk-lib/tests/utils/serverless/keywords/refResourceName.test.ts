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

describe("test keyword SLP::RefResourceName", () => {
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

  test("with SLP::RefResourceName without module", async () => {
    const template = {
      Resources: {
        Resource1: {
          Type: "AWS::Serverless::Function",
          Properties: {
            ...functionDefaults,
            Description: {
              "Fn::Sub": [
                "Invoked from ${restApiName}",
                {
                  restApiName: {
                    "SLP::RefResourceName": {
                      module: "@my-scope/sample1",
                      resource: "Resource2",
                      property: "Name"
                    }
                  }
                }
              ]
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
        `Referenced module resource name {@my-scope/sample1, Resource2, Name} not found. Referenced in "@my-scope/sample" at "Resources/Resource1/Properties/Description/Fn::Sub/1/restApiName"`
      )
    });
  });

  test("with SLP::RefResourceName without resource", async () => {
    const template = {
      Resources: {
        Resource1: {
          Type: "AWS::Serverless::Function",
          Properties: {
            ...functionDefaults,
            Description: {
              "Fn::Sub": [
                "Invoked from ${restApiName}",
                {
                  restApiName: {
                    "SLP::RefResourceName": {
                      resource: "Resource2",
                      property: "Name"
                    }
                  }
                }
              ]
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
        `Referenced module resource name {@my-scope/sample, Resource2, Name} not found. Referenced in "@my-scope/sample" at "Resources/Resource1/Properties/Description/Fn::Sub/1/restApiName"`
      )
    });
  });

  test("with SLP::RefResourceName without property", async () => {
    const template = {
      Resources: {
        Resource1: {
          Type: "AWS::Serverless::Function",
          Properties: {
            ...functionDefaults,
            Description: {
              "Fn::Sub": [
                "Invoked from ${restApiName}",
                {
                  restApiName: {
                    "SLP::RefResourceName": {
                      resource: "Resource2",
                      property: "Name"
                    }
                  }
                }
              ]
            }
          }
        },
        Resource2: {
          Type: "AWS::Serverless::Api",
          Properties: {},
          "SLP::Output": {
            default: true,
            attributes: ["Name"]
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
        `Referenced module resource name {@my-scope/sample, Resource2, Name} not found. Referenced in "@my-scope/sample" at "Resources/Resource1/Properties/Description/Fn::Sub/1/restApiName"`
      )
    });
  });

  test("with SLP::RefResourceName with wrong property", async () => {
    const template = {
      Resources: {
        Resource1: {
          Type: "AWS::Serverless::Function",
          Properties: {
            ...functionDefaults,
            Description: {
              "Fn::Sub": [
                "Invoked from ${restApiName}",
                {
                  restApiName: {
                    "SLP::RefResourceName": {
                      resource: "Resource2",
                      property: "StageName"
                    }
                  }
                }
              ]
            }
          }
        },
        Resource2: {
          Type: "AWS::Serverless::Api",
          Properties: { StageName: "Prod" },
          "SLP::Output": {
            default: true,
            attributes: ["Name"]
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
        `Referenced module resource name property {@my-scope/sample, Resource2, StageName} is not a valid SLP::ResourceName. Referenced in "@my-scope/sample" at "Resources/Resource1/Properties/Description/Fn::Sub/1/restApiName"`
      )
    });
  });

  test("with SLP::RefResourceName with valid local", async () => {
    const template = {
      Resources: {
        Resource1: {
          Type: "AWS::Serverless::Function",
          Properties: {
            ...functionDefaults,
            Description: {
              "Fn::Sub": [
                "Invoked from ${restApiName}",
                {
                  restApiName: {
                    "SLP::RefResourceName": {
                      resource: "Resource2",
                      property: "Name"
                    }
                  }
                }
              ]
            }
          }
        },
        Resource2: {
          Type: "AWS::Serverless::Api",
          Properties: { Name: { "SLP::ResourceName": "restapi" } },
          "SLP::Output": {
            default: true,
            attributes: ["Name"]
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

  test("with SLP::RefResourceName with valid dependent module", async () => {
    const template = {
      Resources: {
        Resource1: {
          Type: "AWS::Serverless::Function",
          Properties: {
            ...functionDefaults,
            Description: {
              "Fn::Sub": [
                "Invoked from ${restApiName}",
                {
                  restApiName: {
                    "SLP::RefResourceName": {
                      module: "@my-scope/sample2",
                      resource: "Resource2",
                      property: "Name"
                    }
                  }
                }
              ]
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
              Type: "AWS::Serverless::Api",
              Properties: { Name: { "SLP::ResourceName": "restapi" } },
              "SLP::Output": {
                default: true,
                attributes: ["Name"]
              }
            }
          }
        }),
      ...doublePackageJson
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
