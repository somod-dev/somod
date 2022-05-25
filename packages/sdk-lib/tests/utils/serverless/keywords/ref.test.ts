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

describe("test keyword SLP::Ref", () => {
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
                      module: "@my-scope/sample2",
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
        'Referenced module resource {@my-scope/sample2, Resource2} not found. Referenced in "@my-scope/sample" at "Resources/Resource1/Properties/Events/ApiEvent/Properties/ApiId"'
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
                      module: "@my-scope/sample2",
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
        'Referenced module resource {@my-scope/sample2, Resource2} not found. Referenced in "@my-scope/sample" at "Resources/Resource1/Properties/Events/ApiEvent/Properties/ApiId"'
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
            module: "@my-scope/sample2",
            resource: "Resource3"
          },
          Properties: {}
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
        'Referenced module resource {@my-scope/sample, Resource2} must not have SLP::Extend. Referenced in "@my-scope/sample" at "Resources/Resource1/Properties/Events/ApiEvent/Properties/ApiId"'
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
                      module: "@my-scope/sample2",
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
      "node_modules/@my-scope/sample2/build/serverless/template.json":
        JSON.stringify({
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
        'Referenced module resource {@my-scope/sample2, Resource2} does not have SLP::Output. Referenced in "@my-scope/sample" at "Resources/Resource1/Properties/Events/ApiEvent/Properties/ApiId"'
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
                      module: "@my-scope/sample2",
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
      "node_modules/@my-scope/sample2/build/serverless/template.json":
        JSON.stringify({
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
        'Referenced module resource {@my-scope/sample2, Resource2} does not have default set to true in SLP::Output. Referenced in "@my-scope/sample" at "Resources/Resource1/Properties/Events/ApiEvent/Properties/ApiId"'
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
                      module: "@my-scope/sample2",
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
      "node_modules/@my-scope/sample2/build/serverless/template.json":
        JSON.stringify({
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
        'Referenced module resource {@my-scope/sample2, Resource2} does not have attribute Id in SLP::Output. Referenced in "@my-scope/sample" at "Resources/Resource1/Properties/Events/ApiEvent/Properties/ApiId"'
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
                      module: "@my-scope/sample2",
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
                      module: "@my-scope/sample2",
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
      "node_modules/@my-scope/sample2/build/serverless/template.json":
        JSON.stringify({
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
});
