import { unixStylePath } from "@solib/cli-base";
import { getPackageLocation } from "@somod/lambda-base-layer";
import { existsSync } from "fs";
import { readFile } from "fs/promises";
import { dump } from "js-yaml";
import { join } from "path";
import { generateSAMTemplate } from "../../../src";
import { createFiles, createTempDir, deleteDir } from "../../utils";

describe("Test Task generateSAMTemplate", () => {
  let dir: string = null;

  beforeEach(async () => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for no resources", async () => {
    createFiles(dir, {
      "package.json": JSON.stringify({
        name: "sample",
        version: "1.0.0",
        somod: "1.3.2",
        dependencies: {}
      })
    });
    await expect(generateSAMTemplate(dir)).resolves.toBeUndefined();
    expect(existsSync(join(dir, "template.yaml"))).toBeFalsy();
  });

  test("for all valid input", async () => {
    createFiles(dir, {
      "node_modules/@sodaru/baseapi/build/serverless/template.json":
        JSON.stringify({
          Parameters: {},
          Resources: {
            BaseRestApi: {
              Type: "AWS::Serverless::Api",
              Properties: {},
              "SOMOD::Output": {
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
                      RestApiId: { "SOMOD::Ref": { resource: "BaseRestApi" } }
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
        somod: "1.3.2",
        dependencies: {}
      }),
      "serverless/template.yaml": dump({
        Resources: {
          CorrectRestApi: {
            "SOMOD::Extend": {
              module: "@sodaru/baseapi",
              resource: "BaseRestApi"
            },
            "SOMOD::DependsOn": [
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
                "SOMOD::ResourceName": "GetAuthGroup"
              },
              CodeUri: { "SOMOD::Function": { name: "getAuthGroup" } },
              Events: {
                ApiEvent: {
                  Type: "Api",
                  Properties: {
                    Method: "GET",
                    Path: "/auth-group/get",
                    RestApiId: {
                      "SOMOD::Ref": {
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
            "SOMOD::DependsOn": [{ resource: "GetAuthGroupFunction" }],
            Properties: {}
          }
        }
      }),
      "package.json": JSON.stringify({
        name: "@sodaru/auth-somod",
        version: "1.0.0",
        somod: "1.3.2",
        dependencies: {
          "@sodaru/baseapi": "^1.0.0"
        }
      })
    });

    await expect(generateSAMTemplate(dir)).resolves.toBeUndefined();
    await expect(
      readFile(join(dir, "template.yaml"), { encoding: "utf8" })
    ).resolves.toEqual(
      dump({
        AWSTemplateFormatVersion: "2010-09-09",
        Transform: "AWS::Serverless-2016-10-31",
        Globals: {
          Function: {
            Runtime: "nodejs16.x",
            Handler: "index.default",
            Architectures: ["arm64"]
          }
        },
        Resources: {
          r64967c02baseLayer: {
            Type: "AWS::Serverless::LayerVersion",
            Properties: {
              LayerName: {
                "Fn::Sub": [
                  "somod${stackId}${moduleHash}${somodResourceName}",
                  {
                    stackId: {
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
                    moduleHash: "64967c02",
                    somodResourceName: "baseLayer"
                  }
                ]
              },
              Description:
                "Set of npm libraries to be required in all Lambda funtions",
              CompatibleArchitectures: ["arm64"],
              CompatibleRuntimes: ["nodejs16.x"],
              RetentionPolicy: "Delete",
              ContentUri: unixStylePath(
                join(await getPackageLocation(), "layer")
              )
            }
          },
          ra046855cBaseRestApi: {
            Type: "AWS::Serverless::Api",
            Properties: {},
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
          rd7ec150dGetAuthGroupFunction: {
            Type: "AWS::Serverless::Function",
            Properties: {
              FunctionName: {
                "Fn::Sub": [
                  "somod${stackId}${moduleHash}${somodResourceName}",
                  {
                    stackId: {
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
                    moduleHash: "d7ec150d",
                    somodResourceName: "GetAuthGroup"
                  }
                ]
              },
              CodeUri: unixStylePath(
                join(dir, "build/serverless/functions/getAuthGroup")
              ),
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
              Layers: [{ Ref: "r64967c02baseLayer" }]
            }
          },
          rd7ec150dListAuthGroupsFunction: {
            Type: "AWS::Serverless::Function",
            Properties: {},
            DependsOn: ["rd7ec150dGetAuthGroupFunction"]
          }
        }
      })
    );
  });
});
