import { readFile } from "fs/promises";
import { join } from "path";
import { generateSAMTemplate } from "../../../src/utils/serverless";
import {
  copyCommonLib,
  createFiles,
  createTempDir,
  deleteDir
} from "../../utils";

describe("Test Util serverlessTemplate.generateSAMTemplate", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for all valid input", async () => {
    await copyCommonLib(dir, "common");
    await copyCommonLib(dir, "slp");
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
        slp: true,
        dependencies: {}
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
            Metadata: { BuildArchitecture: "arm64", BuildMethod: "nodejs14.x" },
            Properties: {
              LayerName: {
                "SLP::ResourceName": "SodaruAuthLayer"
              },
              RetentionPolicy: "Delete",
              CompatibleArchitectures: ["arm64"],
              CompatibleRuntimes: ["nodejs14.x"],
              "SLP::FunctionLayerLibraries": {
                "@sodaru/auth-server-sdk": "^1.0.0"
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
        slp: true,
        dependencies: {
          "@sodaru/baseapi": "^1.0.0"
        }
      })
    });

    await expect(generateSAMTemplate(dir, ["slp"])).resolves.toEqual({
      Parameters: { pa046855cClient: { Type: "String" } },
      Resources: {
        r64967c02baseLayer: {
          Metadata: {
            BuildArchitecture: "arm64",
            BuildMethod: "nodejs14.x"
          },
          Properties: {
            CompatibleArchitectures: ["arm64"],
            CompatibleRuntimes: ["nodejs14.x"],
            RetentionPolicy: "Delete",
            ContentUri: ".slp/lambda-layers/@somod/slp/baseLayer",
            Description:
              "Set of npm libraries to be requiired in all Lambda funtions",
            LayerName: {
              "Fn::Sub": [
                "slp${stackId}${moduleHash}${slpResourceName}",
                {
                  moduleHash: "64967c02",
                  slpResourceName: "baseLayer",
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
                  }
                }
              ]
            }
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
                  }
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
                        }
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
            CodeUri: ".slp/lambdas/@sodaru/baseapi/anotherFunction",
            Layers: [{ Ref: "r64967c02baseLayer" }]
          }
        },
        r624eb34aAuthLayer: {
          Type: "AWS::Serverless::LayerVersion",
          Metadata: { BuildArchitecture: "arm64", BuildMethod: "nodejs14.x" },
          Properties: {
            LayerName: {
              "Fn::Sub": [
                "slp${stackId}${moduleHash}${slpResourceName}",
                {
                  moduleHash: "624eb34a",
                  slpResourceName: "SodaruAuthLayer",
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
                  }
                }
              ]
            },
            CompatibleArchitectures: ["arm64"],
            CompatibleRuntimes: ["nodejs14.x"],
            RetentionPolicy: "Delete",
            ContentUri: ".slp/lambda-layers/@sodaru/auth-slp/SodaruAuthLayer"
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
                  }
                }
              ]
            },
            CodeUri: ".slp/lambdas/@sodaru/auth-slp/getAuthGroup",
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
                        }
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
          "SodaruAuthLayer",
          "package.json"
        ),
        { encoding: "utf8" }
      )
    ).resolves.toEqual(
      JSON.stringify(
        {
          name: "@sodaru/auth-slp-sodaruauthlayer",
          version: "1.0.0",
          description: "Lambda function layer - SodaruAuthLayer",
          dependencies: {
            "@sodaru/auth-server-sdk": "^1.0.0"
          }
        },
        null,
        2
      )
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
        "@somod/slp": {},
        "@sodaru/baseapi": { anotherFunction: [] },
        "@sodaru/auth-slp": { getAuthGroup: ["@sodaru/restapi-sdk"] }
      })
    );

    const lambdaLayerContent = JSON.parse(
      await readFile(
        join(
          dir,
          ".slp",
          "lambda-layers",
          "@somod/slp",
          "baseLayer",
          "package.json"
        ),
        {
          encoding: "utf8"
        }
      )
    );
    expect(lambdaLayerContent).toEqual({
      name: "@somod/slp-baselayer",
      version: "1.0.0",
      description: "Lambda function layer - baseLayer",
      dependencies: {
        ajv: "^8.8.2",
        "ajv-formats": "^2.1.1",
        lodash: "^4.17.21",
        tslib: "^2.3.1",
        uuid: "^8.3.2",
        "aws-sdk": "2.952.0",
        "@somod/common-lib": expect.stringContaining(""),
        "@somod/slp-lib": expect.stringContaining("")
      }
    });
  });
});
