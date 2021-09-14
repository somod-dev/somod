import { createFiles, createTempDir, deleteDir } from "../utils";
import {
  generateSAMTemplate,
  generateServerlessTemplate
} from "../../src/utils/serverlessTemplate";
import { join } from "path";
import { readFile } from "fs/promises";
import { dump } from "js-yaml";

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
        slpFunctionPaths: [],
        slpRefParameterPaths: [],
        slpRefPaths: [],
        slpResourceNamePaths: []
      }
    });
  });

  test("with SLP::Function", async () => {
    createFiles(dir, {
      "build/serverless/template.json": JSON.stringify({
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
                "SLP::Function": {
                  module: "sample",
                  function: "Resource1"
                }
              }
            }
          }
        },
        slpFunctionPaths: [["Resource1", "Properties", "CodeUri"]],
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
        slpFunctionPaths: [],
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
        slpFunctionPaths: [],
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
                "SLP::Function": { module: "sample", function: "resource1" }
              }
            }
          }
        },
        slpFunctionPaths: [["Resource2", "Properties", "CodeUri"]],
        slpRefParameterPaths: [],
        slpRefPaths: [],
        slpResourceNamePaths: [["Resource2", "Properties", "FunctionName"]]
      },
      sample: {
        Resources: {
          Resource2: {
            Type: "AWS::Serverless::Function",
            Properties: {
              CodeUri: {
                "SLP::Function": { module: "sample", function: "resource2" }
              }
            }
          }
        },
        slpFunctionPaths: [["Resource2", "Properties", "CodeUri"]],
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
            "SLP::DependsOn": [
              {
                module: "sample2",
                resource: "Resource2"
              }
            ]
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
            "SLP::DependsOn": [
              {
                module: "sample2",
                resource: "Resource2"
              }
            ]
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
        slpFunctionPaths: [],
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
                "SLP::Function": { module: "sample", function: "resource1" }
              }
            },
            "SLP::DependsOn": [
              {
                module: "sample2",
                resource: "Resource2"
              }
            ]
          }
        },
        slpFunctionPaths: [["Resource1", "Properties", "CodeUri"]],
        slpRefParameterPaths: [],
        slpRefPaths: [],
        slpResourceNamePaths: []
      }
    });
  });

  test("with SLP::RefParameter without module", async () => {
    createFiles(dir, {
      "build/serverless/template.json": JSON.stringify({
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
        'Referenced module parameter {sample2, timeout} not found. Referenced in "sample" at "Resources/Resource1/Properties/Timeout"'
      )
    });
  });

  test("with SLP::RefParameter and with module but no Parameters section", async () => {
    createFiles(dir, {
      "build/serverless/template.json": JSON.stringify({
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
        'Referenced module parameter {sample2, timeout} not found. Referenced in "sample" at "Resources/Resource1/Properties/Timeout"'
      )
    });
  });

  test("with SLP::RefParameter and with module but no Parameter", async () => {
    createFiles(dir, {
      "build/serverless/template.json": JSON.stringify({
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
      }),
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
        'Referenced module parameter {sample2, timeout} not found. Referenced in "sample" at "Resources/Resource1/Properties/Timeout"'
      )
    });
  });

  test("with SLP::RefParameter and with valid module and parameter", async () => {
    createFiles(dir, {
      "build/serverless/template.json": JSON.stringify({
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
      }),
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
          Resource2: {
            Type: "AWS::Serverless::Api",
            Properties: {
              Name: {
                "SLP::ResourceName": "Resource2Api"
              }
            }
          }
        },
        slpFunctionPaths: [],
        slpRefParameterPaths: [],
        slpRefPaths: [],
        slpResourceNamePaths: [["Resource2", "Properties", "Name"]]
      },
      sample: {
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
        },
        slpFunctionPaths: [],
        slpRefParameterPaths: [["Resource1", "Properties", "Timeout"]],
        slpRefPaths: [],
        slpResourceNamePaths: []
      }
    });
  });

  test("with SLP::RefParameter local parameter", async () => {
    createFiles(dir, {
      "build/serverless/template.json": JSON.stringify({
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
        },
        slpFunctionPaths: [],
        slpRefParameterPaths: [["Resource1", "Properties", "Timeout"]],
        slpRefPaths: [],
        slpResourceNamePaths: []
      }
    });
  });

  test("with SLP::Ref without module", async () => {
    createFiles(dir, {
      "build/serverless/template.json": JSON.stringify({
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
        'Referenced module resource {sample2, Resource2} not found. Referenced in "sample" at "Resources/Resource1/Properties/Events/ApiEvent/Properties/RestApiId"'
      )
    });
  });

  test("with SLP::Ref and with module but no Resource", async () => {
    createFiles(dir, {
      "build/serverless/template.json": JSON.stringify({
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
        'Referenced module resource {sample2, Resource2} not found. Referenced in "sample" at "Resources/Resource1/Properties/Events/ApiEvent/Properties/RestApiId"'
      )
    });
  });

  test("with SLP::Ref and with module with Resource but no output", async () => {
    createFiles(dir, {
      "build/serverless/template.json": JSON.stringify({
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
      }),
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
        'Referenced module resource {sample2, Resource2} does not have SLP::Output. Referenced in "sample" at "Resources/Resource1/Properties/Events/ApiEvent/Properties/RestApiId"'
      )
    });
  });

  test("with SLP::Ref and with module with Resource but target output default is false", async () => {
    createFiles(dir, {
      "build/serverless/template.json": JSON.stringify({
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
      }),
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
        'Referenced module resource {sample2, Resource2} does not have default set to true in SLP::Output. Referenced in "sample" at "Resources/Resource1/Properties/Events/ApiEvent/Properties/RestApiId"'
      )
    });
  });

  test("with SLP::Ref and with module with Resource but target output attributes does not include", async () => {
    createFiles(dir, {
      "build/serverless/template.json": JSON.stringify({
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
      }),
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
        'Referenced module resource {sample2, Resource2} does not have attribute Id in SLP::Output. Referenced in "sample" at "Resources/Resource1/Properties/Events/ApiEvent/Properties/RestApiId"'
      )
    });
  });

  test("with SLP::Ref with a valid reference", async () => {
    createFiles(dir, {
      "build/serverless/template.json": JSON.stringify({
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
      }),
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
      sample: {
        Resources: {
          Resource1: {
            Properties: {
              Description: {
                "Fn::Sub": [
                  "Invoked from ${restApiName}",
                  {
                    restApiName: {
                      "SLP::Ref": {
                        attribute: "Name",
                        module: "sample2",
                        resource: "Resource2"
                      }
                    }
                  }
                ]
              },
              Events: {
                ApiEvent: {
                  Properties: {
                    RestApiId: {
                      "SLP::Ref": {
                        module: "sample2",
                        resource: "Resource2"
                      }
                    }
                  },
                  Type: "Api"
                }
              }
            },
            Type: "AWS::Serverless::Function"
          }
        },
        slpFunctionPaths: [],
        slpRefParameterPaths: [],
        slpRefPaths: [
          [
            "Resource1",
            "Properties",
            "Description",
            "Fn::Sub",
            "1",
            "restApiName"
          ],
          [
            "Resource1",
            "Properties",
            "Events",
            "ApiEvent",
            "Properties",
            "RestApiId"
          ]
        ],
        slpResourceNamePaths: []
      },
      sample2: {
        Resources: {
          Resource2: {
            Properties: {},
            "SLP::Output": {
              attributes: ["Name"],
              default: true
            },
            Type: "AWS::Serverless::Api"
          }
        },
        slpFunctionPaths: [],
        slpRefParameterPaths: [],
        slpRefPaths: [],
        slpResourceNamePaths: []
      }
    });
  });

  test("with SLP::Ref with a valid local reference", async () => {
    createFiles(dir, {
      "build/serverless/template.json": JSON.stringify({
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
            Properties: {
              Description: {
                "Fn::Sub": [
                  "Invoked from ${restApiName}",
                  {
                    restApiName: {
                      "SLP::Ref": {
                        attribute: "Name",
                        resource: "Resource2"
                      }
                    }
                  }
                ]
              },
              Events: {
                ApiEvent: {
                  Properties: {
                    RestApiId: {
                      "SLP::Ref": {
                        resource: "Resource2"
                      }
                    }
                  },
                  Type: "Api"
                }
              }
            },
            Type: "AWS::Serverless::Function"
          },
          Resource2: {
            Properties: {},
            "SLP::Output": {
              attributes: ["Name"],
              default: true
            },
            Type: "AWS::Serverless::Api"
          }
        },
        slpFunctionPaths: [],
        slpRefParameterPaths: [],
        slpRefPaths: [
          [
            "Resource1",
            "Properties",
            "Description",
            "Fn::Sub",
            "1",
            "restApiName"
          ],
          [
            "Resource1",
            "Properties",
            "Events",
            "ApiEvent",
            "Properties",
            "RestApiId"
          ]
        ],
        slpResourceNamePaths: []
      }
    });
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
            }
          }
        }),
      "node_modules/@sodaru/baseapi/package.json": JSON.stringify({
        name: "@sodaru/baseapi",
        version: "1.0.1",
        slp: true,
        dependencies: {}
      }),
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
            ]
          },
          GetAuthGroupFunction: {
            Type: "AWS::Serverless::Function",
            Properties: {
              FunctionName: {
                "SLP::ResourceName": "GetAuthGroup"
              },
              CodeUri: { "SLP::Function": "getAuthGroup" },
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
        }
      })
    });

    await expect(generateSAMTemplate(dir, ["slp"])).resolves.toBeUndefined();
    await expect(
      readFile(join(dir, "template.yaml"), { encoding: "utf8" })
    ).resolves.toEqual(
      dump({
        AWSTemplateFormatVersion: "2010-09-09",
        Transform: "AWS::Serverless-2016-10-31",
        Globals: {
          Function: {
            Runtime: "nodejs14.x",
            Handler: "index.handler"
          }
        },
        Parameters: { pa046855cClient: { Type: "String" } },
        Resources: {
          ra046855cBaseRestApi: {
            Type: "AWS::Serverless::Api",
            Properties: {
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
      })
    );
  });
});
