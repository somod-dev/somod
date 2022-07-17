import { createFiles, createTempDir, deleteDir } from "@sodev/test-utils";
import { ErrorSet } from "@solib/cli-base";
import { existsSync } from "fs";
import { readFile } from "fs/promises";
import { dump } from "js-yaml";
import { join } from "path";
import {
  path_build,
  path_functions,
  path_serverless
} from "../../../../src/utils/constants";
import { validateSchema } from "../../../../src/tasks/serverless/validateSchema";
import { buildTemplateYaml } from "../../../../src/utils/serverless/buildTemplateYaml";
import {
  doublePackageJson,
  functionDefaults,
  installSchemaInTempDir,
  singlePackageJson,
  StringifyTemplate
} from "../utils";

describe("Test keyword SOMOD::Function", () => {
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

  test("with SOMOD::Function name only", async () => {
    const template = {
      Resources: {
        Resource1: {
          Type: "AWS::Serverless::Function",
          Properties: {
            Architectures: functionDefaults.Architectures,
            CodeUri: {
              "SOMOD::Function": { name: "Resource1" }
            }
          }
        }
      }
    };
    createFiles(dir, {
      "serverless/template.yaml": dump(template),
      "serverless/functions/Resource1.ts": "",
      ...singlePackageJson
    });
    await validateSchema(dir); // make sure schema is right
    await expect(buildTemplateYaml(dir)).resolves.toBeUndefined();
    await expect(
      readFile(buildTemplateJsonPath, { encoding: "utf8" })
    ).resolves.toEqual(StringifyTemplate(template));
    await expect(
      readFile(
        join(
          dir,
          path_build,
          path_serverless,
          path_functions,
          "Resource1",
          "exclude.json"
        ),
        {
          encoding: "utf8"
        }
      )
    ).resolves.toEqual(
      '{"external":["aws-sdk","@solib/common-types-schemas","@solib/errors","@solib/json-validator","@solib/lambda-event-cfn-custom-resource","@solib/lambda-event-http","lodash","tslib","uuid"]}'
    );
  });

  test("with SOMOD::Function with wrong function name", async () => {
    const template = {
      Resources: {
        Resource1: {
          Type: "AWS::Serverless::Function",
          Properties: {
            Architectures: functionDefaults.Architectures,
            CodeUri: {
              "SOMOD::Function": { name: "Resource1" }
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
    await expect(buildTemplateYaml(dir)).rejects.toMatchObject({
      message: expect.stringContaining(
        `Referenced module function {@my-scope/sample, Resource1} not found. Looked for file "${dir}/serverless/functions/Resource1.ts". Referenced in "@my-scope/sample" at "Resources/Resource1/Properties/CodeUri"`
      )
    });
  });

  test("with SOMOD::Function with extra excludes", async () => {
    const template = {
      Resources: {
        Resource1: {
          Type: "AWS::Serverless::Function",
          Properties: {
            Architectures: functionDefaults.Architectures,
            CodeUri: {
              "SOMOD::Function": { name: "Resource1", exclude: ["smallest"] }
            }
          }
        }
      }
    };
    createFiles(dir, {
      "serverless/template.yaml": dump(template),
      "serverless/functions/Resource1.ts": "",
      ...singlePackageJson
    });
    await validateSchema(dir); // make sure schema is right
    await expect(buildTemplateYaml(dir)).resolves.toBeUndefined();
    await expect(
      readFile(buildTemplateJsonPath, { encoding: "utf8" })
    ).resolves.toEqual(StringifyTemplate(template));
    await expect(
      readFile(
        join(
          dir,
          path_build,
          path_serverless,
          path_functions,
          "Resource1",
          "exclude.json"
        ),
        {
          encoding: "utf8"
        }
      )
    ).resolves.toEqual(
      '{"external":["aws-sdk","smallest","@solib/common-types-schemas","@solib/errors","@solib/json-validator","@solib/lambda-event-cfn-custom-resource","@solib/lambda-event-http","lodash","tslib","uuid"]}'
    );
  });

  test("with customResource SOMOD::Function and no customResources", async () => {
    const template = {
      Resources: {
        Resource1: {
          Type: "AWS::Serverless::Function",
          Properties: {
            Architectures: functionDefaults.Architectures,
            CodeUri: {
              "SOMOD::Function": {
                name: "Resource1",
                exclude: ["smallest"],
                customResources: {
                  MyCustomResource: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      Type: { const: "Custom::MyCustomResource" },
                      Properties: {
                        attr1: { type: "string", maxLength: 20 }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    };
    createFiles(dir, {
      "serverless/template.yaml": dump(template),
      "serverless/functions/Resource1.ts": "",
      ...singlePackageJson
    });
    await validateSchema(dir); // make sure schema is right
    await expect(buildTemplateYaml(dir)).resolves.toBeUndefined();
    await expect(
      readFile(buildTemplateJsonPath, { encoding: "utf8" })
    ).resolves.toEqual(StringifyTemplate(template));
  });

  test("with customResource SOMOD::Function and one bad customResource", async () => {
    const template = {
      Resources: {
        Resource1: {
          Type: "AWS::Serverless::Function",
          "SOMOD::Output": {
            default: true,
            attributes: ["Arn"]
          },
          Properties: {
            Architectures: functionDefaults.Architectures,
            CodeUri: {
              "SOMOD::Function": {
                name: "Resource1",
                exclude: ["smallest"],
                customResources: {
                  MyCustomResource: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      Type: { const: "Custom::MyCustomResource" },
                      Properties: {
                        type: "object",
                        additionalProperties: false,
                        required: ["attr1"],
                        properties: {
                          attr1: { type: "string", maxLength: 20 }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        Resource2: {
          Type: "Custom::MyCustomResource",
          Properties: {
            ServiceToken: {
              "SOMOD::Ref": {
                resource: "Resource1",
                attribute: "Arn"
              }
            }
          }
        }
      }
    };
    createFiles(dir, {
      "serverless/template.yaml": dump(template),
      "serverless/functions/Resource1.ts": "",
      ...singlePackageJson
    });
    await validateSchema(dir); // make sure schema is right
    await expect(buildTemplateYaml(dir)).rejects.toEqual(
      new ErrorSet([
        new Error(
          `Custom Resource Resource2 has following errors\n Properties must have required property 'attr1'`
        )
      ])
    );
    expect(existsSync(buildTemplateJsonPath)).not.toBeTruthy();
  });

  test("with customResource SOMOD::Function and one customResource refering to non existing schema", async () => {
    const template = {
      Resources: {
        Resource1: {
          Type: "AWS::Serverless::Function",
          "SOMOD::Output": {
            default: true,
            attributes: ["Arn"]
          },
          Properties: {
            Architectures: functionDefaults.Architectures,
            CodeUri: {
              "SOMOD::Function": {
                name: "Resource1",
                exclude: ["smallest"],
                customResources: {
                  MyCustomResource: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      Type: { const: "Custom::MyCustomResource" },
                      Properties: {
                        type: "object",
                        additionalProperties: false,
                        required: ["attr1"],
                        properties: {
                          attr1: { type: "string", maxLength: 20 }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        Resource2: {
          Type: "Custom::MyCustomResource1",
          Properties: {
            ServiceToken: {
              "SOMOD::Ref": {
                resource: "Resource1",
                attribute: "Arn"
              }
            }
          }
        }
      }
    };
    createFiles(dir, {
      "serverless/template.yaml": dump(template),
      "serverless/functions/Resource1.ts": "",
      ...singlePackageJson
    });
    await validateSchema(dir); // make sure schema is right
    await expect(buildTemplateYaml(dir)).rejects.toEqual(
      new ErrorSet([
        new Error(
          `Schema not found for CustomResource Resource2. Looked at 'Properties.CodeUri.SOMOD::Function.customResources.MyCustomResource1' in {@my-scope/sample, Resource1}`
        )
      ])
    );
    expect(existsSync(buildTemplateJsonPath)).not.toBeTruthy();
  });

  test("with customResource SOMOD::Function in dependency module and one good customResource in root module", async () => {
    const template = {
      Resources: {
        Resource2: {
          Type: "Custom::MyCustomResource",
          Properties: {
            ServiceToken: {
              "SOMOD::Ref": {
                module: "@my-scope/sample2",
                resource: "Resource1",
                attribute: "Arn"
              }
            },
            attr1: "my-attr1-value"
          }
        }
      }
    };
    createFiles(dir, {
      "serverless/template.yaml": dump(template),
      "serverless/functions/Resource1.ts": "",
      "node_modules/@my-scope/sample2/build/serverless/template.json":
        JSON.stringify(
          {
            Resources: {
              Resource1: {
                Type: "AWS::Serverless::Function",
                "SOMOD::Output": {
                  default: true,
                  attributes: ["Arn"]
                },
                Properties: {
                  Architectures: functionDefaults.Architectures,
                  CodeUri: {
                    "SOMOD::Function": {
                      name: "Resource1",
                      exclude: ["smallest"],
                      customResources: {
                        MyCustomResource: {
                          type: "object",
                          additionalProperties: false,
                          properties: {
                            Type: { const: "Custom::MyCustomResource" },
                            Properties: {
                              type: "object",
                              additionalProperties: false,
                              required: ["attr1"],
                              properties: {
                                attr1: { type: "string", maxLength: 20 }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          null,
          2
        ),
      ...doublePackageJson
    });
    await validateSchema(dir); // make sure schema is right
    await expect(buildTemplateYaml(dir)).resolves.toBeUndefined();
    await expect(
      readFile(buildTemplateJsonPath, { encoding: "utf8" })
    ).resolves.toEqual(StringifyTemplate(template));
  });
});
