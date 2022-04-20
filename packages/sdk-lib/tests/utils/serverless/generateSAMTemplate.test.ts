import { unixStylePath } from "@sodaru/cli-base";
import { CommonLayers } from "@somod/common-layers";
import { existsSync } from "fs";
import { join } from "path";
import { generateSAMTemplate } from "../../../src/utils/serverless";
import { createFiles, createTempDir, deleteDir } from "../../utils";

const stackId = {
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
};

describe("Test Util serverlessTemplate.generateSAMTemplate", () => {
  let dir: string = null;

  beforeEach(async () => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for simple template only", async () => {
    createFiles(dir, {
      "build/serverless/template.json": JSON.stringify({
        Resources: {
          GetAuthGroupFunction: {
            Type: "AWS::Serverless::Function",
            Properties: {
              FunctionName: {
                "SLP::ResourceName": "GetAuthGroup"
              },
              CodeUri: {
                "SLP::Function": {
                  name: "getAuthGroup",
                  exclude: ["@sodaru/restapi-sdk"]
                }
              }
            }
          }
        }
      }),
      "package.json": JSON.stringify({
        name: "@sodaru/auth-slp",
        version: "1.0.0",
        slp: "1.3.2"
      })
    });

    await expect(generateSAMTemplate(dir, ["slp"])).resolves.toEqual({
      Parameters: {},
      Resources: {
        r64967c02baseLayer: {
          Properties: {
            CompatibleArchitectures: ["arm64"],
            CompatibleRuntimes: ["nodejs14.x"],
            RetentionPolicy: "Delete",
            ContentUri: unixStylePath(
              join(
                __dirname,
                "../../../../",
                "common-layers",
                "layers",
                CommonLayers.baseLayer
              )
            ),
            Description:
              "Set of npm libraries to be required in all Lambda funtions",
            LayerName: {
              "Fn::Sub": [
                "slp${stackId}${moduleHash}${slpResourceName}",
                {
                  moduleHash: "64967c02",
                  slpResourceName: "baseLayer",
                  stackId
                }
              ]
            }
          },
          Type: "AWS::Serverless::LayerVersion"
        },
        r624eb34aGetAuthGroupFunction: {
          Type: "AWS::Serverless::Function",
          Properties: {
            FunctionName: {
              "Fn::Sub": [
                "slp${stackId}${moduleHash}${slpResourceName}",
                {
                  moduleHash: "624eb34a",
                  slpResourceName: "GetAuthGroup",
                  stackId
                }
              ]
            },
            CodeUri: unixStylePath(
              join(dir, "build/serverless/functions/getAuthGroup")
            ),
            Layers: [
              {
                Ref: "r64967c02baseLayer"
              }
            ]
          }
        }
      }
    });
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
                CodeUri: { "SLP::Function": { name: "anotherFunction" } }
              }
            }
          }
        }),
      "node_modules/@sodaru/baseapi/package.json": JSON.stringify({
        name: "@sodaru/baseapi",
        version: "1.0.1",
        slp: "1.3.2",
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
          CreateAuthGroupFunction: {
            Type: "AWS::Serverless::Function",
            Properties: {
              FunctionName: {
                "SLP::ResourceName": "CreateAuthGroup"
              },
              CodeUri: {
                "SLP::Function": {
                  name: "createAuthGroup",
                  eventType: "customResourceLayer"
                }
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
              RetentionPolicy: "Delete",
              CompatibleArchitectures: ["arm64"],
              CompatibleRuntimes: ["nodejs14.x"],
              ContentUri: unixStylePath(
                join(
                  dir,
                  "build",
                  "serverless",
                  "functionLayers",
                  "sodaruAuthLayer"
                )
              )
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
              CodeUri: {
                "SLP::Function": {
                  name: "getAuthGroup",
                  exclude: ["@sodaru/restapi-sdk"]
                }
              },
              Layers: [
                {
                  "SLP::Ref": {
                    resource: "AuthLayer"
                  }
                }
              ],
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
          },
          PermissionTable: {
            Type: "AWS::DynamoDB::Table",
            DeletionPolicy: "Retain",
            UpdateReplacePolicy: "Retain"
          }
        }
      }),
      "package.json": JSON.stringify({
        name: "@sodaru/auth-slp",
        version: "1.0.0",
        slp: "1.3.2",
        dependencies: {
          "@sodaru/baseapi": "^1.0.0"
        }
      })
    });

    await expect(generateSAMTemplate(dir, ["slp"])).resolves.toEqual({
      Parameters: { pa046855cClient: { Type: "String" } },
      Resources: {
        r64967c02baseLayer: {
          Properties: {
            CompatibleArchitectures: ["arm64"],
            CompatibleRuntimes: ["nodejs14.x"],
            RetentionPolicy: "Delete",
            ContentUri: unixStylePath(
              join(
                __dirname,
                "../../../../",
                "common-layers",
                "layers",
                CommonLayers.baseLayer
              )
            ),
            Description:
              "Set of npm libraries to be required in all Lambda funtions",
            LayerName: {
              "Fn::Sub": [
                "slp${stackId}${moduleHash}${slpResourceName}",
                {
                  moduleHash: "64967c02",
                  slpResourceName: "baseLayer",
                  stackId
                }
              ]
            }
          },
          Type: "AWS::Serverless::LayerVersion"
        },
        r64967c02customResourceLayer: {
          Properties: {
            CompatibleArchitectures: ["arm64"],
            CompatibleRuntimes: ["nodejs14.x"],
            ContentUri: unixStylePath(
              join(
                __dirname,
                "../../../../",
                "common-layers",
                "layers",
                CommonLayers.customResourceLayer
              )
            ),
            Description:
              "Wrapper libraries to create CloudFormation Custom Resource",
            LayerName: {
              "Fn::Sub": [
                "slp${stackId}${moduleHash}${slpResourceName}",
                {
                  moduleHash: "64967c02",
                  slpResourceName: "customResourceLayer",
                  stackId
                }
              ]
            },
            RetentionPolicy: "Delete"
          },
          Type: "AWS::Serverless::LayerVersion"
        },
        ra046855cBaseRestApi: {
          Type: "AWS::Serverless::Api",
          Properties: {
            Name: {
              "Fn::Sub": [
                "slp${stackId}${moduleHash}${slpResourceName}",
                {
                  moduleHash: "a046855c",
                  slpResourceName: "rootRestApi",
                  stackId
                }
              ]
            },
            Description: {
              "Fn::Sub": [
                "Extends ${baseApi}",
                {
                  baseApi: {
                    "Fn::Sub": [
                      "slp${stackId}${moduleHash}${slpResourceName}",
                      {
                        moduleHash: "a046855c",
                        slpResourceName: "rootRestApi",
                        stackId
                      }
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
            CodeUri: unixStylePath(
              join(
                dir,
                "node_modules/@sodaru/baseapi/build/serverless/functions/anotherFunction"
              )
            ),
            Layers: [{ Ref: "r64967c02baseLayer" }]
          }
        },
        r624eb34aCreateAuthGroupFunction: {
          Properties: {
            CodeUri: unixStylePath(
              join(dir, "build/serverless/functions/createAuthGroup")
            ),
            FunctionName: {
              "Fn::Sub": [
                "slp${stackId}${moduleHash}${slpResourceName}",
                {
                  moduleHash: "624eb34a",
                  slpResourceName: "CreateAuthGroup",
                  stackId
                }
              ]
            },
            Layers: [
              { Ref: "r64967c02baseLayer" },
              { Ref: "r64967c02customResourceLayer" }
            ]
          },
          Type: "AWS::Serverless::Function"
        },
        r624eb34aAuthLayer: {
          Type: "AWS::Serverless::LayerVersion",
          Properties: {
            LayerName: {
              "Fn::Sub": [
                "slp${stackId}${moduleHash}${slpResourceName}",
                {
                  moduleHash: "624eb34a",
                  slpResourceName: "SodaruAuthLayer",
                  stackId
                }
              ]
            },
            CompatibleArchitectures: ["arm64"],
            CompatibleRuntimes: ["nodejs14.x"],
            RetentionPolicy: "Delete",
            ContentUri: unixStylePath(
              join(
                dir,
                "build",
                "serverless",
                "functionLayers",
                "sodaruAuthLayer"
              )
            )
          }
        },
        r624eb34aGetAuthGroupFunction: {
          Type: "AWS::Serverless::Function",
          Properties: {
            FunctionName: {
              "Fn::Sub": [
                "slp${stackId}${moduleHash}${slpResourceName}",
                {
                  moduleHash: "624eb34a",
                  slpResourceName: "GetAuthGroup",
                  stackId
                }
              ]
            },
            CodeUri: unixStylePath(
              join(dir, "build/serverless/functions/getAuthGroup")
            ),
            Description: {
              "Fn::Sub": [
                "Uses layer ${authLayer}",
                {
                  authLayer: {
                    "Fn::Sub": [
                      "slp${stackId}${moduleHash}${slpResourceName}",
                      {
                        moduleHash: "624eb34a",
                        slpResourceName: "SodaruAuthLayer",
                        stackId
                      }
                    ]
                  }
                }
              ]
            },
            Layers: [
              { Ref: "r64967c02baseLayer" },
              {
                Ref: "r624eb34aAuthLayer"
              }
            ],
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
        },
        r624eb34aPermissionTable: {
          Type: "AWS::DynamoDB::Table",
          DeletionPolicy: "Retain",
          UpdateReplacePolicy: "Retain"
        }
      }
    });

    expect(existsSync(join(dir, ".slp"))).not.toBeTruthy();
  });
});
