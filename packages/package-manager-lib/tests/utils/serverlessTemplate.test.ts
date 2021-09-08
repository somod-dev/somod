import { createFiles, createTempDir, deleteDir } from "../utils";
import { generateServerlessTemplate } from "../../src/utils/serverlessTemplate";
import { join } from "path";

describe("Test Util serverlessTemplate.generateServerlessTemplate", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("with empty module", async () => {
    await expect(
      generateServerlessTemplate({
        name: "sample",
        version: "1.0.0",
        dependencies: [],
        packageLocation: dir
      })
    ).resolves.toEqual({});
  });

  test("with only root module", async () => {
    createFiles(dir, {
      "build/serverless/template.json": JSON.stringify({
        Resources: {
          Resource1: {
            Type: "AWS::Serverless::Function",
            Properties: {}
          }
        }
      })
    });
    await expect(
      generateServerlessTemplate({
        name: "sample",
        version: "1.0.0",
        dependencies: [],
        packageLocation: dir
      })
    ).resolves.toEqual({
      sample: {
        Resources: {
          Resource1: {
            Type: "AWS::Serverless::Function",
            Properties: {}
          }
        },
        slpLocationPaths: [],
        slpRefParameterPaths: [],
        slpRefPaths: [],
        slpResourceNamePaths: []
      }
    });
  });

  test("with SLP::Location", async () => {
    createFiles(dir, {
      "build/serverless/template.json": JSON.stringify({
        Resources: {
          Resource1: {
            Type: "AWS::Serverless::Function",
            Properties: {
              CodeUri: {
                "SLP::Location": "./function/Resource1"
              }
            }
          }
        }
      })
    });
    await expect(
      generateServerlessTemplate({
        name: "sample",
        version: "1.0.0",
        dependencies: [],
        packageLocation: dir
      })
    ).resolves.toEqual({
      sample: {
        Resources: {
          Resource1: {
            Type: "AWS::Serverless::Function",
            Properties: {
              CodeUri: {
                "SLP::Location": join(
                  dir,
                  "build",
                  "serverless",
                  "./function/Resource1"
                )
              }
            }
          }
        },
        slpLocationPaths: [["Resource1", "Properties", "CodeUri"]],
        slpRefParameterPaths: [],
        slpRefPaths: [],
        slpResourceNamePaths: []
      }
    });
  });

  test("with SLP::ResourceName", async () => {
    createFiles(dir, {
      "build/serverless/template.json": JSON.stringify({
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
      })
    });
    await expect(
      generateServerlessTemplate({
        name: "sample",
        version: "1.0.0",
        dependencies: [],
        packageLocation: dir
      })
    ).resolves.toEqual({
      sample: {
        Resources: {
          Resource1: {
            Type: "AWS::Serverless::Function",
            Properties: {
              FunctionName: {
                "SLP::ResourceName": "Resource1"
              }
            }
          }
        },
        slpLocationPaths: [],
        slpRefParameterPaths: [],
        slpRefPaths: [],
        slpResourceNamePaths: [["Resource1", "Properties", "FunctionName"]]
      }
    });
  });

  test("with SLP::Output", async () => {
    createFiles(dir, {
      "build/serverless/template.json": JSON.stringify({
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
      })
    });
    await expect(
      generateServerlessTemplate({
        name: "sample",
        version: "1.0.0",
        dependencies: [],
        packageLocation: dir
      })
    ).resolves.toEqual({
      sample: {
        Resources: {
          Resource1: {
            Type: "AWS::Serverless::Function",
            Properties: {},
            "SLP::Output": {
              default: true,
              attributes: []
            }
          }
        },
        slpLocationPaths: [],
        slpRefParameterPaths: [],
        slpRefPaths: [],
        slpResourceNamePaths: []
      }
    });
  });

  test("with SLP::Extend without module", async () => {
    createFiles(dir, {
      "build/serverless/template.json": JSON.stringify({
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
      })
    });
    await expect(
      generateServerlessTemplate({
        name: "sample",
        version: "1.0.0",
        dependencies: [],
        packageLocation: dir
      })
    ).rejects.toMatchObject({
      message: expect.stringContaining(
        "Extended module resource {sample2, Resource2} not found. Extended in {sample, Resource1}"
      )
    });
  });

  test("with SLP::Extend and with module but no resource", async () => {
    createFiles(dir, {
      "build/serverless/template.json": JSON.stringify({
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
      }),
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
      generateServerlessTemplate({
        name: "sample",
        version: "1.0.0",
        dependencies: [
          {
            name: "sample2",
            version: "1.0.0",
            dependencies: [],
            packageLocation: join(dir, "node_modules", "sample2")
          }
        ],
        packageLocation: dir
      })
    ).rejects.toMatchObject({
      message: expect.stringContaining(
        "Extended module resource {sample2, Resource2} not found. Extended in {sample, Resource1}"
      )
    });
  });

  test("with SLP::Extend and with valid module and resource", async () => {
    createFiles(dir, {
      "build/serverless/template.json": JSON.stringify({
        Resources: {
          Resource1: {
            Type: "AWS::Serverless::Function",
            Properties: {
              CodeUri: {
                "SLP::Location": "./functions/resource1"
              }
            },
            "SLP::Extend": {
              module: "sample2",
              resource: "Resource2"
            }
          }
        }
      }),
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
      generateServerlessTemplate({
        name: "sample",
        version: "1.0.0",
        dependencies: [
          {
            name: "sample2",
            version: "1.0.0",
            dependencies: [],
            packageLocation: join(dir, "node_modules", "sample2")
          }
        ],
        packageLocation: dir
      })
    ).resolves.toEqual({
      sample2: {
        Resources: {
          Resource2: {
            Type: "AWS::Serverless::Function",
            Properties: {
              FunctionName: {
                "SLP::ResourceName": "Resource2Function"
              },
              CodeUri: {
                "SLP::Location": join(
                  dir,
                  "build",
                  "serverless",
                  "./functions/resource1"
                )
              }
            }
          }
        },
        slpLocationPaths: [["Resource2", "Properties", "CodeUri"]],
        slpRefParameterPaths: [],
        slpRefPaths: [],
        slpResourceNamePaths: [["Resource2", "Properties", "FunctionName"]]
      },
      sample: {
        Resources: {},
        slpLocationPaths: [],
        slpRefParameterPaths: [],
        slpRefPaths: [],
        slpResourceNamePaths: []
      }
    });
  });

  test("with SLP::DependsOn without module", async () => {
    createFiles(dir, {
      "build/serverless/template.json": JSON.stringify({
        Resources: {
          Resource1: {
            Type: "AWS::Serverless::Function",
            Properties: {},
            "SLP::DependsOn": {
              module: "sample2",
              resource: "Resource2"
            }
          }
        }
      })
    });
    await expect(
      generateServerlessTemplate({
        name: "sample",
        version: "1.0.0",
        dependencies: [],
        packageLocation: dir
      })
    ).rejects.toMatchObject({
      message: expect.stringContaining(
        "Dependent module resource {sample2, Resource2} not found. Depended from {sample, Resource1}"
      )
    });
  });

  test("with SLP::DependsOn and with module but no resource", async () => {
    createFiles(dir, {
      "build/serverless/template.json": JSON.stringify({
        Resources: {
          Resource1: {
            Type: "AWS::Serverless::Function",
            Properties: {},
            "SLP::DependsOn": {
              module: "sample2",
              resource: "Resource2"
            }
          }
        }
      }),
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
      generateServerlessTemplate({
        name: "sample",
        version: "1.0.0",
        dependencies: [
          {
            name: "sample2",
            version: "1.0.0",
            dependencies: [],
            packageLocation: join(dir, "node_modules", "sample2")
          }
        ],
        packageLocation: dir
      })
    ).rejects.toMatchObject({
      message: expect.stringContaining(
        "Dependent module resource {sample2, Resource2} not found. Depended from {sample, Resource1}"
      )
    });
  });

  test("with SLP::DependsOn and with valid module and resource", async () => {
    createFiles(dir, {
      "build/serverless/template.json": JSON.stringify({
        Resources: {
          Resource1: {
            Type: "AWS::Serverless::Function",
            Properties: {
              CodeUri: {
                "SLP::Location": "./functions/resource1"
              }
            },
            "SLP::DependsOn": {
              module: "sample2",
              resource: "Resource2"
            }
          }
        }
      }),
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
      generateServerlessTemplate({
        name: "sample",
        version: "1.0.0",
        dependencies: [
          {
            name: "sample2",
            version: "1.0.0",
            dependencies: [],
            packageLocation: join(dir, "node_modules", "sample2")
          }
        ],
        packageLocation: dir
      })
    ).resolves.toEqual({
      sample2: {
        Resources: {
          Resource2: {
            Type: "AWS::Serverless::Api",
            Properties: {
              Name: {
                "SLP::ResourceName": "Resource2Api"
              }
            }
          }
        },
        slpLocationPaths: [],
        slpRefParameterPaths: [],
        slpRefPaths: [],
        slpResourceNamePaths: [["Resource2", "Properties", "Name"]]
      },
      sample: {
        Resources: {
          Resource1: {
            Type: "AWS::Serverless::Function",
            Properties: {
              CodeUri: {
                "SLP::Location": join(
                  dir,
                  "build",
                  "serverless",
                  "./functions/resource1"
                )
              }
            },
            "SLP::DependsOn": {
              module: "sample2",
              resource: "Resource2"
            }
          }
        },
        slpLocationPaths: [["Resource1", "Properties", "CodeUri"]],
        slpRefParameterPaths: [],
        slpRefPaths: [],
        slpResourceNamePaths: []
      }
    });
  });
});
