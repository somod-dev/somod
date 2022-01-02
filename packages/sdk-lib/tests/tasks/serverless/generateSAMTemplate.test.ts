import { readFile } from "fs/promises";
import { dump } from "js-yaml";
import { join } from "path";
import { generateSAMTemplate } from "../../../src";
import {
  copyCommonLib,
  createFiles,
  createTempDir,
  deleteDir
} from "../../utils";

describe("Test Task generateSAMTemplate", () => {
  let dir: string = null;

  beforeEach(async () => {
    dir = createTempDir();
    await copyCommonLib(dir, "common");
    await copyCommonLib(dir, "slp");
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for no resources", async () => {
    createFiles(dir, {
      "package.json": JSON.stringify({
        name: "sample",
        version: "1.0.0",
        slp: true,
        dependencies: {}
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
            Handler: "index.default"
          }
        },
        Parameters: {},
        Resources: {
          r64967c02baseLayer: {
            Type: "AWS::Serverless::LayerVersion",
            Metadata: {
              BuildMethod: "nodejs14.x",
              BuildArchitecture: "arm64"
            },
            Properties: {
              LayerName: {
                "Fn::Join": [
                  "",
                  [
                    "slp",
                    {
                      "Fn::Select": [
                        2,
                        {
                          "Fn::Split": [
                            "/",
                            {
                              Ref: "AWS::StackId"
                            }
                          ]
                        }
                      ]
                    },
                    "64967c02baseLayer"
                  ]
                ]
              },
              Description:
                "Set of npm libraries to be requiired in all Lambda funtions",
              CompatibleArchitectures: ["arm64"],
              CompatibleRuntimes: ["nodejs14.x"],
              ContentUri: ".slp/lambda-layers/@somod/slp/baseLayer"
            }
          }
        }
      })
    );
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
            Handler: "index.default"
          }
        },
        Parameters: { pa046855cClient: { Type: "String" } },
        Resources: {
          r64967c02baseLayer: {
            Type: "AWS::Serverless::LayerVersion",
            Metadata: {
              BuildMethod: "nodejs14.x",
              BuildArchitecture: "arm64"
            },
            Properties: {
              LayerName: {
                "Fn::Join": [
                  "",
                  [
                    "slp",
                    {
                      "Fn::Select": [
                        2,
                        {
                          "Fn::Split": [
                            "/",
                            {
                              Ref: "AWS::StackId"
                            }
                          ]
                        }
                      ]
                    },
                    "64967c02baseLayer"
                  ]
                ]
              },
              Description:
                "Set of npm libraries to be requiired in all Lambda funtions",
              CompatibleArchitectures: ["arm64"],
              CompatibleRuntimes: ["nodejs14.x"],
              ContentUri: ".slp/lambda-layers/@somod/slp/baseLayer"
            }
          },
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
              },
              Layers: [{ $ref: "r64967c02baseLayer" }]
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
              },
              Layers: [{ $ref: "r64967c02baseLayer" }]
            }
          },
          r624eb34aListAuthGroupsFunction: {
            Type: "AWS::Serverless::Function",
            Properties: {
              Tags: {
                Client: {
                  Ref: "pa046855cClient"
                }
              },
              Layers: [{ $ref: "r64967c02baseLayer" }]
            },
            DependsOn: ["r624eb34aGetAuthGroupFunction"]
          }
        }
      })
    );
  });
});
