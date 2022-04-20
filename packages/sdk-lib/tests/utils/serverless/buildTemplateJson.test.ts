import { existsSync } from "fs";
import { readFile } from "fs/promises";
import { dump } from "js-yaml";
import { join } from "path";
import { buildTemplateJson } from "../../../src/utils/serverless";
import { createFiles, createTempDir, deleteDir } from "../../utils";
import { NoSLPTemplateError } from "../../../src/utils/serverless/slpTemplate";
import {
  path_build,
  path_functions,
  path_serverless,
  path_functionLayers
} from "../../../src/utils/constants";
import { validateSchema } from "../../../src/tasks/serverless/validateSchema";
import { copyDirectory } from "@sodev/test-utils";

const installSchemaInTempDir = async (dir: string) => {
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

const functionDefaults = {
  Architectures: ["arm64"],
  InlineCode: ""
};

describe("Test Util serverless.buildTemplateJson", () => {
  let dir: string = null;
  let buildTemplateJsonPath = null;
  const moduleIndicators = ["slp"];

  const singlePackageJson = {
    "package.json": JSON.stringify({
      name: "sample",
      version: "1.0.0",
      dependencies: {},
      slp: "1.3.2"
    })
  };

  const doublePackageJson = {
    "package.json": JSON.stringify({
      name: "sample",
      version: "1.0.0",
      dependencies: { sample2: "^1.0.0" },
      slp: "1.3.2"
    }),
    "node_modules/sample2/package.json": JSON.stringify({
      name: "sample2",
      version: "1.0.0",
      dependencies: {},
      slp: "1.3.2"
    })
  };

  const StringifyTemplate = (json: unknown): string => {
    return JSON.stringify(json, null, 2) + "\n";
  };

  beforeEach(async () => {
    dir = createTempDir();
    buildTemplateJsonPath = join(dir, "build", "serverless", "template.json");
    await installSchemaInTempDir(dir);
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("with empty module", async () => {
    createFiles(dir, { ...singlePackageJson });
    await expect(buildTemplateJson(dir, moduleIndicators)).rejects.toEqual(
      new NoSLPTemplateError(join(dir, "serverless", "template.yaml"))
    );
    expect(existsSync(buildTemplateJsonPath)).toBeFalsy();
  });

  test("with only root module", async () => {
    const template = {
      Resources: {
        Resource1: {
          Type: "AWS::Serverless::Function",
          Properties: { ...functionDefaults }
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

  test("with reused modules", async () => {
    /**
     * The Dependency tree is
     *             sample
     *             /     \
     *        sample2    sample3
     *             \     /     \
     *             sample4     sample5
     */
    const template = {
      Resources: {
        Resource1: {
          Type: "AWS::Serverless::Function",
          "SLP::Extend": {
            module: "sample3",
            resource: "Sample3Function"
          },
          "SLP::DependsOn": [
            {
              module: "sample5",
              resource: "AnotherFunction"
            }
          ],
          Properties: { ...functionDefaults }
        }
      }
    };
    createFiles(dir, {
      "serverless/template.yaml": dump(template),
      "package.json": JSON.stringify({
        name: "sample",
        version: "1.0.0",
        dependencies: { sample2: "^1.0.0", sample3: "^1.0.0" },
        slp: "1.3.2"
      }),
      "node_modules/sample2/package.json": JSON.stringify({
        name: "sample2",
        version: "1.0.0",
        dependencies: { sample4: "^1.0.0" },
        slp: "1.3.2"
      }),
      "node_modules/sample2/build/serverless/template.json": JSON.stringify({
        Resources: {
          Sample2Function: {
            Type: "AWS::Serverless::Function",
            "SLP::DependsOn": [
              {
                module: "sample4",
                resource: "OriginalFunction"
              }
            ],
            Properties: { ...functionDefaults }
          }
        }
      }),
      "node_modules/sample3/package.json": JSON.stringify({
        name: "sample3",
        version: "1.0.0",
        dependencies: { sample4: "^1.0.0", sample5: "^1.0.0" },
        slp: "1.3.2"
      }),
      "node_modules/sample3/build/serverless/template.json": JSON.stringify({
        Resources: {
          Sample3Function: {
            Type: "AWS::Serverless::Function",
            "SLP::DependsOn": [
              {
                module: "sample4",
                resource: "OriginalFunction"
              }
            ],
            Properties: { ...functionDefaults }
          }
        }
      }),
      "node_modules/sample4/package.json": JSON.stringify({
        name: "sample4",
        version: "1.0.0",
        dependencies: {},
        slp: "1.3.2"
      }),
      "node_modules/sample4/build/serverless/template.json": JSON.stringify({
        Resources: {
          OriginalFunction: {
            Type: "AWS::Serverless::Function",
            Properties: { ...functionDefaults }
          }
        }
      }),
      "node_modules/sample5/package.json": JSON.stringify({
        name: "sample5",
        version: "1.0.0",
        dependencies: {},
        slp: "1.3.2"
      }),
      "node_modules/sample5/build/serverless/template.json": JSON.stringify({
        Resources: {
          AnotherFunction: {
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

  test("with SLP::Function name only", async () => {
    const template = {
      Resources: {
        Resource1: {
          Type: "AWS::Serverless::Function",
          Properties: {
            Architectures: functionDefaults.Architectures,
            CodeUri: {
              "SLP::Function": { name: "Resource1" }
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
    await expect(
      buildTemplateJson(dir, moduleIndicators)
    ).resolves.toBeUndefined();
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
      '{"external":["aws-sdk","@solib/json-validator","@solib/common-types-schemas","@solib/errors","lodash","tslib","uuid"]}'
    );
  });

  test("with SLP::Function with wrong function name", async () => {
    const template = {
      Resources: {
        Resource1: {
          Type: "AWS::Serverless::Function",
          Properties: {
            Architectures: functionDefaults.Architectures,
            CodeUri: {
              "SLP::Function": { name: "Resource1" }
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
        `Referenced module function {sample, Resource1} not found. Looked for file "${dir}/serverless/functions/Resource1.ts". Referenced in "sample" at "Resources/Resource1/Properties/CodeUri"`
      )
    });
  });

  test("with SLP::Function with extra excludes", async () => {
    const template = {
      Resources: {
        Resource1: {
          Type: "AWS::Serverless::Function",
          Properties: {
            Architectures: functionDefaults.Architectures,
            CodeUri: {
              "SLP::Function": { name: "Resource1", exclude: ["smallest"] }
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
    await expect(
      buildTemplateJson(dir, moduleIndicators)
    ).resolves.toBeUndefined();
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
      '{"external":["aws-sdk","smallest","@solib/json-validator","@solib/common-types-schemas","@solib/errors","lodash","tslib","uuid"]}'
    );
  });

  test("with SLP::Function with customResourceLayer = true", async () => {
    const template = {
      Resources: {
        Resource1: {
          Type: "AWS::Serverless::Function",
          Properties: {
            Architectures: functionDefaults.Architectures,
            CodeUri: {
              "SLP::Function": {
                name: "Resource1",
                eventType: "customResourceLayer"
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
    await expect(
      buildTemplateJson(dir, moduleIndicators)
    ).resolves.toBeUndefined();
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
      '{"external":["aws-sdk","@solib/json-validator","@solib/common-types-schemas","@solib/errors","lodash","tslib","uuid","@solib/cfn-custom-resource"]}'
    );
  });

  test("with SLP::FunctionLayerLibraries", async () => {
    const template = {
      Resources: {
        Resource1: {
          Type: "AWS::Serverless::LayerVersion",
          Properties: {
            CompatibleArchitectures: ["arm64"],
            CompatibleRuntimes: ["nodejs14.x"],
            LayerName: {
              "SLP::ResourceName": "mylayer"
            },
            "SLP::FunctionLayerLibraries": ["smallest"],
            RetentionPolicy: "Delete"
          }
        }
      }
    };
    createFiles(dir, {
      "serverless/template.yaml": dump(template),
      "package.json": JSON.stringify({
        name: "sample",
        version: "1.0.0",
        devDependencies: {
          smallest: "^1.0.1"
        },
        slp: "1.3.2"
      })
    });
    await validateSchema(dir); // make sure schema is right
    await expect(
      buildTemplateJson(dir, moduleIndicators)
    ).resolves.toBeUndefined();
    await expect(
      readFile(buildTemplateJsonPath, { encoding: "utf8" })
    ).resolves.toEqual(StringifyTemplate(template));
    await expect(
      readFile(
        join(
          dir,
          path_build,
          path_serverless,
          path_functionLayers,
          "mylayer",
          "nodejs",
          "package.json"
        ),
        { encoding: "utf8" }
      )
    ).resolves.toEqual(
      JSON.stringify(
        {
          name: "sample-mylayer",
          version: "1.0.0",
          description: "Lambda function layer - mylayer",
          dependencies: {
            smallest: "^1.0.1"
          }
        },
        null,
        2
      )
    );
  });

  test("with SLP::ResourceName", async () => {
    const template = {
      Resources: {
        Resource1: {
          Type: "AWS::DynamoDB::Table",
          Properties: {
            TableName: {
              "SLP::ResourceName": "Resource1"
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

  test("with SLP::ResourceName on extended resource", async () => {
    const template = {
      Resources: {
        Resource1: {
          Type: "AWS::DynamoDB::Table",
          "SLP::Extend": { module: "sample2", resource: "Resource2" },
          Properties: {
            TableName: {
              "SLP::ResourceName": "Resource1"
            }
          }
        }
      }
    };
    createFiles(dir, {
      "serverless/template.yaml": dump(template),
      "node_modules/sample2/build/serverless/template.json": JSON.stringify({
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
    await expect(
      buildTemplateJson(dir, moduleIndicators)
    ).resolves.toBeUndefined();
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
      buildTemplateJson(dir, moduleIndicators)
    ).resolves.toBeUndefined();
    await expect(
      readFile(buildTemplateJsonPath, { encoding: "utf8" })
    ).resolves.toEqual(StringifyTemplate(template));
  });

  test("with SLP::Extend without module", async () => {
    const template = {
      Resources: {
        Resource1: {
          Type: "AWS::Serverless::Function",
          Properties: { ...functionDefaults },
          "SLP::Extend": {
            module: "sample2",
            resource: "Resource2"
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
        "Extended module resource {sample2, Resource2} not found. Extended in {sample, Resource1}"
      )
    });
    expect(existsSync(buildTemplateJsonPath)).toBeFalsy();
  });

  test("with SLP::Extend and with module but no resource", async () => {
    const template = {
      Resources: {
        Resource1: {
          Type: "AWS::Serverless::Function",
          Properties: { ...functionDefaults },
          "SLP::Extend": {
            module: "sample2",
            resource: "Resource2"
          }
        }
      }
    };
    createFiles(dir, {
      "serverless/template.yaml": dump(template),
      ...doublePackageJson,
      "node_modules/sample2/build/serverless/template.json": JSON.stringify({
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
        "Extended module resource {sample2, Resource2} not found. Extended in {sample, Resource1}"
      )
    });
  });

  test("with SLP::Extend and with valid module and resource", async () => {
    const template = {
      Resources: {
        Resource1: {
          Type: "AWS::Serverless::Function",
          Properties: {
            Architectures: functionDefaults.Architectures,
            CodeUri: {
              "SLP::Function": { name: "resource1" }
            }
          },
          "SLP::Extend": {
            module: "sample2",
            resource: "Resource2"
          }
        },
        Resource2: {
          Type: "AWS::Serverless::Function",
          Properties: {
            ...functionDefaults
          }
        }
      }
    };
    createFiles(dir, {
      "serverless/template.yaml": dump(template),
      "serverless/functions/resource1.ts": "",
      "serverless/functions/resource2.ts": "",
      ...doublePackageJson,
      "node_modules/sample2/build/serverless/template.json": JSON.stringify({
        Resources: {
          Resource2: {
            Type: "AWS::Serverless::Function",
            Properties: {
              ...functionDefaults
            }
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

  test("with SLP::DependsOn without module", async () => {
    const template = {
      Resources: {
        Resource1: {
          Type: "AWS::Serverless::Function",
          Properties: { ...functionDefaults },
          "SLP::DependsOn": [
            {
              module: "sample2",
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
      buildTemplateJson(dir, moduleIndicators)
    ).rejects.toMatchObject({
      message: expect.stringContaining(
        "Dependent module resource {sample2, Resource2} not found. Depended from {sample, Resource1}"
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
              module: "sample2",
              resource: "Resource2"
            }
          ]
        }
      }
    };
    createFiles(dir, {
      "serverless/template.yaml": dump(template),
      ...doublePackageJson,
      "node_modules/sample2/build/serverless/template.json": JSON.stringify({
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
        "Dependent module resource {sample2, Resource2} not found. Depended from {sample, Resource1}"
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
              module: "sample2",
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
      "node_modules/sample2/build/serverless/template.json": JSON.stringify({
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
      buildTemplateJson(dir, moduleIndicators)
    ).resolves.toBeUndefined();
    await expect(
      readFile(buildTemplateJsonPath, { encoding: "utf8" })
    ).resolves.toEqual(StringifyTemplate(template));
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
                module: "sample2"
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
        'Referenced module parameter {sample2, timeout} not found. Referenced in "sample" at "Resources/Resource1/Properties/Timeout"'
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
                module: "sample2"
              }
            }
          }
        }
      }
    };
    createFiles(dir, {
      "serverless/template.yaml": dump(template),
      ...doublePackageJson,
      "node_modules/sample2/build/serverless/template.json": JSON.stringify({
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
        'Referenced module parameter {sample2, timeout} not found. Referenced in "sample" at "Resources/Resource1/Properties/Timeout"'
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
                module: "sample2"
              }
            }
          }
        }
      }
    };
    createFiles(dir, {
      "serverless/template.yaml": dump(template),
      ...doublePackageJson,
      "node_modules/sample2/build/serverless/template.json": JSON.stringify({
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
        'Referenced module parameter {sample2, timeout} not found. Referenced in "sample" at "Resources/Resource1/Properties/Timeout"'
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
                module: "sample2"
              }
            }
          }
        }
      }
    };
    createFiles(dir, {
      "serverless/template.yaml": dump(template),
      ...doublePackageJson,
      "node_modules/sample2/build/serverless/template.json": JSON.stringify({
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

  test("with SLP::Ref without module", async () => {
    const template = {
      Resources: {
        Resource1: {
          Type: "AWS::Serverless::Function",
          Properties: {
            ...functionDefaults,
            Events: {
              ApiEvent: {
                Type: "HttpApi",
                Properties: {
                  ApiId: {
                    "SLP::Ref": {
                      module: "sample2",
                      resource: "Resource2"
                    }
                  },
                  Method: "GET",
                  Path: "/m/r"
                }
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
        'Referenced module resource {sample2, Resource2} not found. Referenced in "sample" at "Resources/Resource1/Properties/Events/ApiEvent/Properties/ApiId"'
      )
    });
  });

  test("with SLP::Ref and with module but no Resource", async () => {
    const template = {
      Resources: {
        Resource1: {
          Type: "AWS::Serverless::Function",
          Properties: {
            ...functionDefaults,
            Events: {
              ApiEvent: {
                Type: "HttpApi",
                Properties: {
                  ApiId: {
                    "SLP::Ref": {
                      module: "sample2",
                      resource: "Resource2"
                    }
                  },
                  Method: "GET",
                  Path: "/m/r"
                }
              }
            }
          }
        }
      }
    };
    createFiles(dir, {
      "serverless/template.yaml": dump(template),
      ...doublePackageJson,
      "node_modules/sample2/build/serverless/template.json": JSON.stringify({
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
        'Referenced module resource {sample2, Resource2} not found. Referenced in "sample" at "Resources/Resource1/Properties/Events/ApiEvent/Properties/ApiId"'
      )
    });
  });

  test("with SLP::Ref and with module with Extended Resource", async () => {
    const template = {
      Resources: {
        Resource1: {
          Type: "AWS::Serverless::Function",
          Properties: {
            ...functionDefaults,
            Events: {
              ApiEvent: {
                Type: "HttpApi",
                Properties: {
                  ApiId: {
                    "SLP::Ref": {
                      resource: "Resource2"
                    }
                  },
                  Method: "GET",
                  Path: "/m/r"
                }
              }
            }
          }
        },
        Resource2: {
          Type: "AWS::Serverless::Api",
          "SLP::Extend": {
            module: "sample2",
            resource: "Resource3"
          },
          Properties: {}
        }
      }
    };
    createFiles(dir, {
      "serverless/template.yaml": dump(template),
      ...doublePackageJson,
      "node_modules/sample2/build/serverless/template.json": JSON.stringify({
        Resources: {
          Resource3: {
            Type: "AWS::Serverless::Api",
            Properties: {}
          }
        }
      })
    });
    await validateSchema(dir); // make sure schema is right
    await expect(
      buildTemplateJson(dir, moduleIndicators)
    ).rejects.toMatchObject({
      message: expect.stringContaining(
        'Referenced module resource {sample, Resource2} must not have SLP::Extend. Referenced in "sample" at "Resources/Resource1/Properties/Events/ApiEvent/Properties/ApiId"'
      )
    });
  });

  test("with SLP::Ref and with module with Resource but no output", async () => {
    const template = {
      Resources: {
        Resource1: {
          Type: "AWS::Serverless::Function",
          Properties: {
            ...functionDefaults,
            Events: {
              ApiEvent: {
                Type: "HttpApi",
                Properties: {
                  ApiId: {
                    "SLP::Ref": {
                      module: "sample2",
                      resource: "Resource2"
                    }
                  },
                  Method: "GET",
                  Path: "/m/r"
                }
              }
            }
          }
        }
      }
    };
    createFiles(dir, {
      "serverless/template.yaml": dump(template),
      ...doublePackageJson,
      "node_modules/sample2/build/serverless/template.json": JSON.stringify({
        Resources: {
          Resource2: {
            Type: "AWS::Serverless::Api",
            Properties: {}
          }
        }
      })
    });
    await validateSchema(dir); // make sure schema is right
    await expect(
      buildTemplateJson(dir, moduleIndicators)
    ).rejects.toMatchObject({
      message: expect.stringContaining(
        'Referenced module resource {sample2, Resource2} does not have SLP::Output. Referenced in "sample" at "Resources/Resource1/Properties/Events/ApiEvent/Properties/ApiId"'
      )
    });
  });

  test("with SLP::Ref and with module with Resource but target output default is false", async () => {
    const template = {
      Resources: {
        Resource1: {
          Type: "AWS::Serverless::Function",
          Properties: {
            ...functionDefaults,
            Events: {
              ApiEvent: {
                Type: "HttpApi",
                Properties: {
                  ApiId: {
                    "SLP::Ref": {
                      module: "sample2",
                      resource: "Resource2"
                    }
                  },
                  Method: "GET",
                  Path: "/m/r"
                }
              }
            }
          }
        }
      }
    };
    createFiles(dir, {
      "serverless/template.yaml": dump(template),
      ...doublePackageJson,
      "node_modules/sample2/build/serverless/template.json": JSON.stringify({
        Resources: {
          Resource2: {
            Type: "AWS::Serverless::Api",
            Properties: {},
            "SLP::Output": {
              default: false
            }
          }
        }
      })
    });
    await validateSchema(dir); // make sure schema is right
    await expect(
      buildTemplateJson(dir, moduleIndicators)
    ).rejects.toMatchObject({
      message: expect.stringContaining(
        'Referenced module resource {sample2, Resource2} does not have default set to true in SLP::Output. Referenced in "sample" at "Resources/Resource1/Properties/Events/ApiEvent/Properties/ApiId"'
      )
    });
  });

  test("with SLP::Ref and with module with Resource but target output attributes does not include", async () => {
    const template = {
      Resources: {
        Resource1: {
          Type: "AWS::Serverless::Function",
          Properties: {
            ...functionDefaults,
            Events: {
              ApiEvent: {
                Type: "HttpApi",
                Properties: {
                  ApiId: {
                    "SLP::Ref": {
                      module: "sample2",
                      resource: "Resource2",
                      attribute: "Id"
                    }
                  },
                  Method: "GET",
                  Path: "/m/r"
                }
              }
            }
          }
        }
      }
    };
    createFiles(dir, {
      "serverless/template.yaml": dump(template),
      ...doublePackageJson,
      "node_modules/sample2/build/serverless/template.json": JSON.stringify({
        Resources: {
          Resource2: {
            Type: "AWS::Serverless::Api",
            Properties: {},
            "SLP::Output": {
              default: true,
              attributes: ["Name"]
            }
          }
        }
      })
    });
    await validateSchema(dir); // make sure schema is right
    await expect(
      buildTemplateJson(dir, moduleIndicators)
    ).rejects.toMatchObject({
      message: expect.stringContaining(
        'Referenced module resource {sample2, Resource2} does not have attribute Id in SLP::Output. Referenced in "sample" at "Resources/Resource1/Properties/Events/ApiEvent/Properties/ApiId"'
      )
    });
  });

  test("with SLP::Ref with a valid reference", async () => {
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
                    "SLP::Ref": {
                      module: "sample2",
                      resource: "Resource2",
                      attribute: "Name"
                    }
                  }
                }
              ]
            },
            Events: {
              ApiEvent: {
                Type: "HttpApi",
                Properties: {
                  ApiId: {
                    "SLP::Ref": {
                      module: "sample2",
                      resource: "Resource2"
                    }
                  },
                  Method: "GET",
                  Path: "/m/r"
                }
              }
            }
          }
        }
      }
    };
    createFiles(dir, {
      "serverless/template.yaml": dump(template),
      ...doublePackageJson,
      "node_modules/sample2/build/serverless/template.json": JSON.stringify({
        Resources: {
          Resource2: {
            Type: "AWS::Serverless::Api",
            Properties: {},
            "SLP::Output": {
              default: true,
              attributes: ["Name"]
            }
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

  test("with SLP::Ref with a valid local reference", async () => {
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
                    "SLP::Ref": {
                      resource: "Resource2",
                      attribute: "Name"
                    }
                  }
                }
              ]
            },
            Events: {
              ApiEvent: {
                Type: "HttpApi",
                Properties: {
                  ApiId: {
                    "SLP::Ref": {
                      resource: "Resource2"
                    }
                  },
                  Method: "GET",
                  Path: "/m/r"
                }
              }
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
    ).resolves.toBeUndefined();
    await expect(
      readFile(buildTemplateJsonPath, { encoding: "utf8" })
    ).resolves.toEqual(StringifyTemplate(template));
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
                      module: "sample1",
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
        `Referenced module resource name {sample1, Resource2, Name} not found. Referenced in "sample" at "Resources/Resource1/Properties/Description/Fn::Sub/1/restApiName"`
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
        `Referenced module resource name {sample, Resource2, Name} not found. Referenced in "sample" at "Resources/Resource1/Properties/Description/Fn::Sub/1/restApiName"`
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
        `Referenced module resource name {sample, Resource2, Name} not found. Referenced in "sample" at "Resources/Resource1/Properties/Description/Fn::Sub/1/restApiName"`
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
        `Referenced module resource name property {sample, Resource2, StageName} is not a valid SLP::ResourceName. Referenced in "sample" at "Resources/Resource1/Properties/Description/Fn::Sub/1/restApiName"`
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
                      module: "sample2",
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
      "node_modules/sample2/build/serverless/template.json": JSON.stringify({
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
