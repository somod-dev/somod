import { createFiles, createTempDir, deleteDir } from "../utils";
import {
  generateSAMTemplate,
  buildTemplateJson
} from "../../src/utils/serverlessTemplate";
import { join } from "path";
import { readFile } from "fs/promises";
import { dump } from "js-yaml";
import { existsSync } from "fs";

describe("Test Util serverlessTemplate.buildTemplateJson", () => {
  let dir: string = null;
  let buildTemplateJsonPath = null;
  const moduleIndicators = ["slp"];

  const singlePackageJson = {
    "package.json": JSON.stringify({
      name: "sample",
      version: "1.0.0",
      dependencies: {},
      slp: true
    })
  };

  const doublePackageJson = {
    "package.json": JSON.stringify({
      name: "sample",
      version: "1.0.0",
      dependencies: { sample2: "^1.0.0" },
      slp: true
    }),
    "node_modules/sample2/package.json": JSON.stringify({
      name: "sample2",
      version: "1.0.0",
      dependencies: {},
      slp: true
    })
  };

  const StringifyTemplate = (json: unknown): string => {
    return JSON.stringify(json, null, 2) + "\n";
  };

  beforeEach(() => {
    dir = createTempDir();
    buildTemplateJsonPath = join(dir, "build", "serverless", "template.json");
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("with empty module", async () => {
    createFiles(dir, { ...singlePackageJson });
    await expect(
      buildTemplateJson(dir, moduleIndicators)
    ).rejects.toMatchObject({
      message: expect.stringContaining(
        `file "${join(dir, "serverless", "template.yaml")}" does not exist`
      )
    });
    expect(existsSync(buildTemplateJsonPath)).toBeFalsy();
  });

  test("with only root module", async () => {
    const template = {
      Resources: {
        Resource1: {
          Type: "AWS::Serverless::Function",
          Properties: {}
        }
      }
    };
    createFiles(dir, {
      "serverless/template.yaml": dump(template),
      ...singlePackageJson
    });

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
          Properties: {}
        }
      }
    };
    createFiles(dir, {
      "serverless/template.yaml": dump(template),
      "package.json": JSON.stringify({
        name: "sample",
        version: "1.0.0",
        dependencies: { sample2: "^1.0.0", sample3: "^1.0.0" },
        slp: true
      }),
      "node_modules/sample2/package.json": JSON.stringify({
        name: "sample2",
        version: "1.0.0",
        dependencies: { sample4: "^1.0.0" },
        slp: true
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
            Properties: {}
          }
        }
      }),
      "node_modules/sample3/package.json": JSON.stringify({
        name: "sample3",
        version: "1.0.0",
        dependencies: { sample4: "^1.0.0", sample5: "^1.0.0" },
        slp: true
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
            Properties: {}
          }
        }
      }),
      "node_modules/sample4/package.json": JSON.stringify({
        name: "sample4",
        version: "1.0.0",
        dependencies: {},
        slp: true
      }),
      "node_modules/sample4/build/serverless/template.json": JSON.stringify({
        Resources: {
          OriginalFunction: {
            Type: "AWS::Serverless::Function",
            Properties: {}
          }
        }
      }),
      "node_modules/sample5/package.json": JSON.stringify({
        name: "sample5",
        version: "1.0.0",
        dependencies: {},
        slp: true
      }),
      "node_modules/sample5/build/serverless/template.json": JSON.stringify({
        Resources: {
          AnotherFunction: {
            Type: "AWS::Serverless::Function",
            Properties: {}
          }
        }
      })
    });

    await expect(
      buildTemplateJson(dir, moduleIndicators)
    ).resolves.toBeUndefined();

    await expect(
      readFile(buildTemplateJsonPath, { encoding: "utf8" })
    ).resolves.toEqual(StringifyTemplate(template));
  });

  test("with SLP::Function", async () => {
    const template = {
      Resources: {
        Resource1: {
          Type: "AWS::Serverless::Function",
          Properties: {
            CodeUri: {
              "SLP::Function": "Resource1"
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
    await expect(
      buildTemplateJson(dir, moduleIndicators)
    ).resolves.toBeUndefined();
    await expect(
      readFile(buildTemplateJsonPath, { encoding: "utf8" })
    ).resolves.toEqual(StringifyTemplate(template));
  });

  test("with SLP::Function with wrong function name", async () => {
    const template = {
      Resources: {
        Resource1: {
          Type: "AWS::Serverless::Function",
          Properties: {
            CodeUri: {
              "SLP::Function": "Resource1"
            }
          }
        }
      }
    };
    createFiles(dir, {
      "serverless/template.yaml": dump(template),
      ...singlePackageJson
    });
    await expect(
      buildTemplateJson(dir, moduleIndicators)
    ).rejects.toMatchObject({
      message: expect.stringContaining(
        `Referenced module function {sample, Resource1} not found. Looked for file "${dir}/serverless/functions/Resource1.ts". Referenced in "sample" at "Resources/Resource1/Properties/CodeUri"`
      )
    });
  });

  test("with SLP::FunctionLayer", async () => {
    const template = {
      Resources: {
        Resource1: {
          Type: "AWS::Serverless::LayerVersion",
          Properties: {
            ContentUri: {
              "SLP::FunctionLayer": "Resource1"
            }
          }
        }
      }
    };
    createFiles(dir, {
      "serverless/template.yaml": dump(template),
      "serverless/function-layers/Resource1.json": "",
      ...singlePackageJson
    });
    await expect(
      buildTemplateJson(dir, moduleIndicators)
    ).resolves.toBeUndefined();
    await expect(
      readFile(buildTemplateJsonPath, { encoding: "utf8" })
    ).resolves.toEqual(StringifyTemplate(template));
  });

  test("with SLP::FunctionLayer with wrong layer name", async () => {
    const template = {
      Resources: {
        Resource1: {
          Type: "AWS::Serverless::LayerVersion",
          Properties: {
            ContentUri: {
              "SLP::FunctionLayer": "Resource1"
            }
          }
        }
      }
    };
    createFiles(dir, {
      "serverless/template.yaml": dump(template),
      ...singlePackageJson
    });
    await expect(
      buildTemplateJson(dir, moduleIndicators)
    ).rejects.toMatchObject({
      message: expect.stringContaining(
        `Referenced module function layer {sample, Resource1} not found. Looked for file "${dir}/serverless/function-layers/Resource1.json". Referenced in "sample" at "Resources/Resource1/Properties/ContentUri"`
      )
    });
  });

  test("with SLP::ResourceName", async () => {
    const template = {
      Resources: {
        Resource1: {
          Type: "AWS::Serverless::Function",
          Properties: {
            FunctionName: {
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
          Type: "AWS::Serverless::Function",
          "SLP::Extend": { module: "sample2", resource: "Resource2" },
          Properties: {
            FunctionName: {
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
            Type: "AWS::Serverless::Function",
            Properties: {}
          }
        }
      }),
      ...doublePackageJson
    });
    await expect(
      buildTemplateJson(dir, moduleIndicators)
    ).rejects.toMatchObject({
      message: expect.stringContaining(
        'Extended Resource can not specify SLP::ResourceName. Specified in "sample" at "Resources/Resource1/Properties/FunctionName"'
      )
    });
  });

  test("with SLP::Output", async () => {
    const template = {
      Resources: {
        Resource1: {
          Type: "AWS::Serverless::Function",
          Properties: {},
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
          Properties: {},
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
          Properties: {},
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
            Properties: {}
          }
        }
      })
    });
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
            CodeUri: {
              "SLP::Function": "resource1"
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
            CodeUri: {
              "SLP::Function": "resource2"
            }
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
              FunctionName: {
                "SLP::ResourceName": "Resource2Function"
              }
            }
          }
        }
      })
    });
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
          Properties: {},
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
          Properties: {},
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
            Properties: {}
          }
        }
      })
    });
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
            CodeUri: {
              "SLP::Function": "resource1"
            }
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
            Properties: {}
          }
        }
      })
    });
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
            Properties: {}
          }
        }
      })
    });
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
            Properties: {}
          }
        }
      })
    });

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
            Events: {
              ApiEvent: {
                Type: "Api",
                Properties: {
                  RestApiId: {
                    "SLP::Ref": {
                      module: "sample2",
                      resource: "Resource2"
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
      ...singlePackageJson
    });
    await expect(
      buildTemplateJson(dir, moduleIndicators)
    ).rejects.toMatchObject({
      message: expect.stringContaining(
        'Referenced module resource {sample2, Resource2} not found. Referenced in "sample" at "Resources/Resource1/Properties/Events/ApiEvent/Properties/RestApiId"'
      )
    });
  });

  test("with SLP::Ref and with module but no Resource", async () => {
    const template = {
      Resources: {
        Resource1: {
          Type: "AWS::Serverless::Function",
          Properties: {
            Events: {
              ApiEvent: {
                Type: "Api",
                Properties: {
                  RestApiId: {
                    "SLP::Ref": {
                      module: "sample2",
                      resource: "Resource2"
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
      ...doublePackageJson,
      "node_modules/sample2/build/serverless/template.json": JSON.stringify({
        Resources: {
          Resource3: {
            Type: "AWS::Serverless::Function",
            Properties: {}
          }
        }
      })
    });
    await expect(
      buildTemplateJson(dir, moduleIndicators)
    ).rejects.toMatchObject({
      message: expect.stringContaining(
        'Referenced module resource {sample2, Resource2} not found. Referenced in "sample" at "Resources/Resource1/Properties/Events/ApiEvent/Properties/RestApiId"'
      )
    });
  });

  test("with SLP::Ref and with module with Extended Resource", async () => {
    const template = {
      Resources: {
        Resource1: {
          Type: "AWS::Serverless::Function",
          Properties: {
            Events: {
              ApiEvent: {
                Type: "Api",
                Properties: {
                  RestApiId: {
                    "SLP::Ref": {
                      resource: "Resource2"
                    }
                  }
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
    await expect(
      buildTemplateJson(dir, moduleIndicators)
    ).rejects.toMatchObject({
      message: expect.stringContaining(
        'Referenced module resource {sample, Resource2} must not have SLP::Extend. Referenced in "sample" at "Resources/Resource1/Properties/Events/ApiEvent/Properties/RestApiId"'
      )
    });
  });

  test("with SLP::Ref and with module with Resource but no output", async () => {
    const template = {
      Resources: {
        Resource1: {
          Type: "AWS::Serverless::Function",
          Properties: {
            Events: {
              ApiEvent: {
                Type: "Api",
                Properties: {
                  RestApiId: {
                    "SLP::Ref": {
                      module: "sample2",
                      resource: "Resource2"
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
    await expect(
      buildTemplateJson(dir, moduleIndicators)
    ).rejects.toMatchObject({
      message: expect.stringContaining(
        'Referenced module resource {sample2, Resource2} does not have SLP::Output. Referenced in "sample" at "Resources/Resource1/Properties/Events/ApiEvent/Properties/RestApiId"'
      )
    });
  });

  test("with SLP::Ref and with module with Resource but target output default is false", async () => {
    const template = {
      Resources: {
        Resource1: {
          Type: "AWS::Serverless::Function",
          Properties: {
            Events: {
              ApiEvent: {
                Type: "Api",
                Properties: {
                  RestApiId: {
                    "SLP::Ref": {
                      module: "sample2",
                      resource: "Resource2"
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
    await expect(
      buildTemplateJson(dir, moduleIndicators)
    ).rejects.toMatchObject({
      message: expect.stringContaining(
        'Referenced module resource {sample2, Resource2} does not have default set to true in SLP::Output. Referenced in "sample" at "Resources/Resource1/Properties/Events/ApiEvent/Properties/RestApiId"'
      )
    });
  });

  test("with SLP::Ref and with module with Resource but target output attributes does not include", async () => {
    const template = {
      Resources: {
        Resource1: {
          Type: "AWS::Serverless::Function",
          Properties: {
            Events: {
              ApiEvent: {
                Type: "Api",
                Properties: {
                  RestApiId: {
                    "SLP::Ref": {
                      module: "sample2",
                      resource: "Resource2",
                      attribute: "Id"
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
    await expect(
      buildTemplateJson(dir, moduleIndicators)
    ).rejects.toMatchObject({
      message: expect.stringContaining(
        'Referenced module resource {sample2, Resource2} does not have attribute Id in SLP::Output. Referenced in "sample" at "Resources/Resource1/Properties/Events/ApiEvent/Properties/RestApiId"'
      )
    });
  });

  test("with SLP::Ref with a valid reference", async () => {
    const template = {
      Resources: {
        Resource1: {
          Type: "AWS::Serverless::Function",
          Properties: {
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
                Type: "Api",
                Properties: {
                  RestApiId: {
                    "SLP::Ref": {
                      module: "sample2",
                      resource: "Resource2"
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
                Type: "Api",
                Properties: {
                  RestApiId: {
                    "SLP::Ref": {
                      resource: "Resource2"
                    }
                  }
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
    await expect(
      buildTemplateJson(dir, moduleIndicators)
    ).rejects.toMatchObject({
      message: expect.stringContaining(
        `Referenced module resource name {undefined, Resource2, Name} not found. Referenced in "sample" at "Resources/Resource1/Properties/Description/Fn::Sub/1/restApiName"`
      )
    });
  });

  test("with SLP::RefResourceName without property", async () => {
    const template = {
      Resources: {
        Resource1: {
          Type: "AWS::Serverless::Function",
          Properties: {
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
    await expect(
      buildTemplateJson(dir, moduleIndicators)
    ).rejects.toMatchObject({
      message: expect.stringContaining(
        `Referenced module resource name {undefined, Resource2, Name} not found. Referenced in "sample" at "Resources/Resource1/Properties/Description/Fn::Sub/1/restApiName"`
      )
    });
  });

  test("with SLP::RefResourceName with wrong property", async () => {
    const template = {
      Resources: {
        Resource1: {
          Type: "AWS::Serverless::Function",
          Properties: {
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
    await expect(
      buildTemplateJson(dir, moduleIndicators)
    ).rejects.toMatchObject({
      message: expect.stringContaining(
        `Referenced module resource name property {undefined, Resource2, StageName} is not a valid SLP::ResourceName. Referenced in "sample" at "Resources/Resource1/Properties/Description/Fn::Sub/1/restApiName"`
      )
    });
  });

  test("with SLP::RefResourceName with valid local", async () => {
    const template = {
      Resources: {
        Resource1: {
          Type: "AWS::Serverless::Function",
          Properties: {
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
    await expect(
      buildTemplateJson(dir, moduleIndicators)
    ).resolves.toBeUndefined();
    await expect(
      readFile(buildTemplateJsonPath, { encoding: "utf8" })
    ).resolves.toEqual(StringifyTemplate(template));
  });
});

describe("Test Util serverlessTemplate.generateSAMTemplate", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for all valid input", async () => {
    createFiles(dir, {
      "node_modules/@sodaru/baseapi/build/serverless/template.json":
        JSON.stringify({
          Parameters: {
            Client: {
              SAMType: "String",
              schema: { type: "string", maxLength: 32 }
            }
          },
          Resources: {
            BaseRestApi: {
              Type: "AWS::Serverless::Api",
              Properties: {
                Name: { "SLP::ResourceName": "rootRestApi" },
                Tags: {
                  Client: { "SLP::RefParameter": { parameter: "Client" } }
                }
              },
              "SLP::Output": {
                default: true,
                attributes: ["RootResourceId"]
              }
            },
            BaseRestApiWelcomeFunction: {
              Type: "AWS::Serverless::Function",
              Properties: {
                InlineCode:
                  'module.exports.handler = async (event, context) => { return { "body": "Welcome to Entranse Platform APIs", "statusCode": 200 }; }',
                Events: {
                  ApiEvent: {
                    Type: "Api",
                    Properties: {
                      Method: "GET",
                      Path: "/",
                      RestApiId: { "SLP::Ref": { resource: "BaseRestApi" } }
                    }
                  }
                }
              }
            },
            BaseAnotherFunction: {
              Type: "AWS::Serverless::Function",
              Properties: {
                CodeUri: { "SLP::Function": "anotherFunction" }
              }
            }
          }
        }),
      "node_modules/@sodaru/baseapi/package.json": JSON.stringify({
        name: "@sodaru/baseapi",
        version: "1.0.1",
        slp: true,
        dependencies: {}
      }),
      "build/serverless/function-layers/authLayer.json": JSON.stringify({
        name: "authlayer",
        dependencies: { "@sodaru/auth-server-sdk": "^1.0.0" }
      }),
      "build/serverless/functions/getAuthGroup.js":
        'import aws from "aws-sdk";\nimport { authorize }  from "@sodaru/restapi-sdk";\nconst a = () => {console.log("Success");};\nexport default a;',
      "build/serverless/functionIndex.js":
        'export { default as getAuthGroup } from "./functions/getAuthGroup";',
      "build/index.js": 'export * from "./serverless/functionIndex"',
      "build/serverless/template.json": JSON.stringify({
        Resources: {
          CorrectRestApi: {
            "SLP::Extend": {
              module: "@sodaru/baseapi",
              resource: "BaseRestApi"
            },
            "SLP::DependsOn": [
              {
                module: "@sodaru/baseapi",
                resource: "BaseRestApiWelcomeFunction"
              }
            ],
            Properties: {
              Description: {
                "Fn::Sub": [
                  "Extends ${baseApi}",
                  {
                    baseApi: {
                      "SLP::RefResourceName": {
                        module: "@sodaru/baseapi",
                        resource: "BaseRestApi",
                        property: "Name"
                      }
                    }
                  }
                ]
              }
            }
          },
          AuthLayer: {
            Type: "AWS::Serverless::LayerVersion",
            "SLP::Output": {
              default: true,
              attributes: []
            },
            Properties: {
              LayerName: {
                "SLP::ResourceName": "SodaruAuthLayer"
              },
              CompatibleArchitectures: ["arm64"],
              CompatibleRuntimes: ["nodejs14.x"],
              ContentUri: {
                "SLP::FunctionLayer": "authLayer"
              }
            }
          },
          GetAuthGroupFunction: {
            Type: "AWS::Serverless::Function",
            Properties: {
              FunctionName: {
                "SLP::ResourceName": "GetAuthGroup"
              },
              Description: {
                "Fn::Sub": [
                  "Uses layer ${authLayer}",
                  {
                    authLayer: {
                      "SLP::RefResourceName": {
                        resource: "AuthLayer",
                        property: "LayerName"
                      }
                    }
                  }
                ]
              },
              CodeUri: { "SLP::Function": "getAuthGroup" },
              Layers: {
                "SLP::Ref": {
                  resource: "AuthLayer"
                }
              },
              Events: {
                ApiEvent: {
                  Type: "Api",
                  Properties: {
                    Method: "GET",
                    Path: "/auth-group/get",
                    RestApiId: {
                      "SLP::Ref": {
                        module: "@sodaru/baseapi",
                        resource: "BaseRestApi"
                      }
                    }
                  }
                }
              }
            }
          },
          ListAuthGroupsFunction: {
            Type: "AWS::Serverless::Function",
            "SLP::DependsOn": [{ resource: "GetAuthGroupFunction" }],
            Properties: {
              Tags: {
                Client: {
                  "SLP::RefParameter": {
                    module: "@sodaru/baseapi",
                    parameter: "Client"
                  }
                }
              }
            }
          }
        }
      }),
      "package.json": JSON.stringify({
        name: "@sodaru/auth-slp",
        version: "1.0.0",
        slp: true,
        dependencies: {
          "@sodaru/baseapi": "^1.0.0"
        },
        slpLambdaBundleExclude: {
          getAuthGroup: ["@sodaru/restapi-sdk"]
        }
      })
    });

    await expect(generateSAMTemplate(dir, ["slp"])).resolves.toEqual({
      Parameters: { pa046855cClient: { Type: "String" } },
      Resources: {
        ra046855cBaseRestApi: {
          Type: "AWS::Serverless::Api",
          Properties: {
            Name: {
              "Fn::Join": [
                "",
                [
                  "slp",
                  {
                    "Fn::Select": [
                      2,
                      { "Fn::Split": ["/", { Ref: "AWS::StackId" }] }
                    ]
                  },
                  "a046855crootRestApi"
                ]
              ]
            },
            Description: {
              "Fn::Sub": [
                "Extends ${baseApi}",
                {
                  baseApi: {
                    "Fn::Join": [
                      "",
                      [
                        "slp",
                        {
                          "Fn::Select": [
                            2,
                            { "Fn::Split": ["/", { Ref: "AWS::StackId" }] }
                          ]
                        },
                        "a046855crootRestApi"
                      ]
                    ]
                  }
                }
              ]
            },
            Tags: {
              Client: { Ref: "pa046855cClient" }
            }
          },
          DependsOn: ["ra046855cBaseRestApiWelcomeFunction"]
        },
        ra046855cBaseRestApiWelcomeFunction: {
          Type: "AWS::Serverless::Function",
          Properties: {
            InlineCode:
              'module.exports.handler = async (event, context) => { return { "body": "Welcome to Entranse Platform APIs", "statusCode": 200 }; }',
            Events: {
              ApiEvent: {
                Type: "Api",
                Properties: {
                  Method: "GET",
                  Path: "/",
                  RestApiId: { Ref: "ra046855cBaseRestApi" }
                }
              }
            }
          }
        },
        ra046855cBaseAnotherFunction: {
          Type: "AWS::Serverless::Function",
          Properties: {
            CodeUri: ".slp/lambdas/@sodaru/baseapi/anotherFunction"
          }
        },
        r624eb34aAuthLayer: {
          Type: "AWS::Serverless::LayerVersion",
          Properties: {
            LayerName: {
              "Fn::Join": [
                "",
                [
                  "slp",
                  {
                    "Fn::Select": [
                      2,
                      { "Fn::Split": ["/", { Ref: "AWS::StackId" }] }
                    ]
                  },
                  "624eb34aSodaruAuthLayer"
                ]
              ]
            },
            CompatibleArchitectures: ["arm64"],
            CompatibleRuntimes: ["nodejs14.x"],
            ContentUri: ".slp/lambda-layers/@sodaru/auth-slp/authLayer"
          }
        },
        r624eb34aGetAuthGroupFunction: {
          Type: "AWS::Serverless::Function",
          Properties: {
            FunctionName: {
              "Fn::Join": [
                "",
                [
                  "slp",
                  {
                    "Fn::Select": [
                      2,
                      { "Fn::Split": ["/", { Ref: "AWS::StackId" }] }
                    ]
                  },
                  "624eb34aGetAuthGroup"
                ]
              ]
            },
            CodeUri: ".slp/lambdas/@sodaru/auth-slp/getAuthGroup",
            Description: {
              "Fn::Sub": [
                "Uses layer ${authLayer}",
                {
                  authLayer: {
                    "Fn::Join": [
                      "",
                      [
                        "slp",
                        {
                          "Fn::Select": [
                            2,
                            { "Fn::Split": ["/", { Ref: "AWS::StackId" }] }
                          ]
                        },
                        "624eb34aSodaruAuthLayer"
                      ]
                    ]
                  }
                }
              ]
            },
            Layers: {
              Ref: "r624eb34aAuthLayer"
            },
            Events: {
              ApiEvent: {
                Type: "Api",
                Properties: {
                  Method: "GET",
                  Path: "/auth-group/get",
                  RestApiId: {
                    Ref: "ra046855cBaseRestApi"
                  }
                }
              }
            }
          }
        },
        r624eb34aListAuthGroupsFunction: {
          Type: "AWS::Serverless::Function",
          Properties: {
            Tags: {
              Client: {
                Ref: "pa046855cClient"
              }
            }
          },
          DependsOn: ["r624eb34aGetAuthGroupFunction"]
        }
      }
    });

    await expect(
      readFile(
        join(dir, ".slp", "functions", "@sodaru/baseapi", "anotherFunction.js"),
        { encoding: "utf8" }
      )
    ).resolves.toEqual(
      'export { anotherFunction as default } from "@sodaru/baseapi";'
    );

    await expect(
      readFile(
        join(
          dir,
          ".slp",
          "lambda-layers",
          "@sodaru/auth-slp",
          "authLayer",
          "package.json"
        ),
        { encoding: "utf8" }
      )
    ).resolves.toEqual(
      JSON.stringify({
        name: "authlayer",
        dependencies: { "@sodaru/auth-server-sdk": "^1.0.0" }
      })
    );

    await expect(
      readFile(
        join(dir, ".slp", "functions", "@sodaru/auth-slp", "getAuthGroup.js"),
        { encoding: "utf8" }
      )
    ).resolves.toEqual(
      'export { getAuthGroup as default } from "../../../../build";'
    );

    await expect(
      readFile(join(dir, ".slp", "lambdaBundleExclude.json"), {
        encoding: "utf8"
      })
    ).resolves.toEqual(
      JSON.stringify({
        "@sodaru/auth-slp": { getAuthGroup: ["@sodaru/restapi-sdk"] }
      })
    );
  });
});
