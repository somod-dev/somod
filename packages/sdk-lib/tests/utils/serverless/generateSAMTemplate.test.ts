import { unixStylePath } from "@solib/cli-base";
import { existsSync } from "fs";
import { dump } from "js-yaml";
import { join } from "path";
import { generateSAMTemplate } from "../../../src/utils/serverless/generateSAMTemplate";
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
      "serverless/template.yaml": dump({
        Resources: {
          GetAuthGroupFunction: {
            Type: "AWS::Serverless::Function",
            Properties: {
              FunctionName: {
                "SOMOD::ResourceName": "GetAuthGroup"
              },
              CodeUri: {
                "SOMOD::Function": {
                  name: "getAuthGroup",
                  exclude: ["@sodaru/restapi-sdk"]
                }
              }
            }
          }
        }
      }),
      "package.json": JSON.stringify({
        name: "@sodaru/auth-somod",
        version: "1.0.0",
        somod: "1.3.2"
      })
    });

    await expect(generateSAMTemplate(dir)).resolves.toEqual({
      Resources: {
        r64967c02baseLayer: {
          Properties: {
            CompatibleArchitectures: ["arm64"],
            CompatibleRuntimes: ["nodejs14.x"],
            RetentionPolicy: "Delete",
            ContentUri: unixStylePath(
              join(
                __dirname,
                "../../../",
                "node_modules",
                "@somod/lambda-base-layer",
                "layer"
              )
            ),
            Description:
              "Set of npm libraries to be required in all Lambda funtions",
            LayerName: {
              "Fn::Sub": [
                "somod${stackId}${moduleHash}${somodResourceName}",
                {
                  moduleHash: "64967c02",
                  somodResourceName: "baseLayer",
                  stackId
                }
              ]
            }
          },
          Type: "AWS::Serverless::LayerVersion"
        },
        rd7ec150dGetAuthGroupFunction: {
          Type: "AWS::Serverless::Function",
          Properties: {
            FunctionName: {
              "Fn::Sub": [
                "somod${stackId}${moduleHash}${somodResourceName}",
                {
                  moduleHash: "d7ec150d",
                  somodResourceName: "GetAuthGroup",
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

  test("for no root template", async () => {
    createFiles(dir, {
      "node_modules/@sodaru/baseapi/build/serverless/template.json":
        JSON.stringify({
          Resources: {
            BaseRestApi: {
              Type: "AWS::Serverless::Api",
              Properties: {
                Name: { "SOMOD::ResourceName": "rootRestApi" }
              },
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
                      Path: {
                        "SOMOD::ModuleName": "${SOMOD::ModuleName}/"
                      },
                      RestApiId: { "SOMOD::Ref": { resource: "BaseRestApi" } }
                    }
                  }
                }
              }
            },
            BaseAnotherFunction: {
              Type: "AWS::Serverless::Function",
              Properties: {
                CodeUri: { "SOMOD::Function": { name: "anotherFunction" } }
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
      "package.json": JSON.stringify({
        name: "@sodaru/auth-somod",
        version: "1.0.0",
        somod: "1.3.2",
        dependencies: {
          "@sodaru/baseapi": "^1.0.0"
        }
      })
    });

    const result = await generateSAMTemplate(dir);

    expect(result).toEqual({
      Resources: {
        r64967c02baseLayer: {
          Properties: {
            CompatibleArchitectures: ["arm64"],
            CompatibleRuntimes: ["nodejs14.x"],
            RetentionPolicy: "Delete",
            ContentUri: unixStylePath(
              join(
                __dirname,
                "../../../",
                "node_modules",
                "@somod/lambda-base-layer",
                "layer"
              )
            ),
            Description:
              "Set of npm libraries to be required in all Lambda funtions",
            LayerName: {
              "Fn::Sub": [
                "somod${stackId}${moduleHash}${somodResourceName}",
                {
                  moduleHash: "64967c02",
                  somodResourceName: "baseLayer",
                  stackId
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
                "somod${stackId}${moduleHash}${somodResourceName}",
                {
                  moduleHash: "a046855c",
                  somodResourceName: "rootRestApi",
                  stackId
                }
              ]
            }
          }
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
                  Path: "@sodaru/baseapi/",
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
        }
      }
    });
  });

  test("for all valid input", async () => {
    createFiles(dir, {
      "node_modules/@sodaru/baseapi/build/parameters.json": JSON.stringify({
        Parameters: {
          "my.var1": { type: "text", default: "1" },
          "my.var3": { type: "text" }
        }
      }),
      "node_modules/@sodaru/baseapi/build/serverless/template.json":
        JSON.stringify({
          Resources: {
            BaseRestApi: {
              Type: "AWS::Serverless::Api",
              Properties: {
                Name: { "SOMOD::ResourceName": "rootRestApi" }
              },
              "SOMOD::Output": {
                default: true,
                attributes: ["RootResourceId"],
                export: {
                  RootResourceId: "my.var3"
                }
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
                      Path: {
                        "SOMOD::ModuleName": "${SOMOD::ModuleName}/"
                      },
                      RestApiId: { "SOMOD::Ref": { resource: "BaseRestApi" } }
                    }
                  }
                }
              }
            },
            BaseAnotherFunction: {
              Type: "AWS::Serverless::Function",
              Properties: {
                CodeUri: { "SOMOD::Function": { name: "anotherFunction" } }
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
      "parameters.yaml": dump({
        Parameters: {
          "my.var2": { type: "text" },
          "output.var4": { type: "text", default: "1" }
        }
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
            ],
            Properties: {
              Description: {
                "Fn::Sub": [
                  "Extends ${baseApi} in ${SOMOD::ModuleName}",
                  {
                    baseApi: {
                      "SOMOD::RefResourceName": {
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
                "SOMOD::ResourceName": "CreateAuthGroup"
              },
              CodeUri: {
                "SOMOD::Function": {
                  name: "createAuthGroup"
                }
              },
              Environment: {
                Variables: {
                  MY_VAR1: { "SOMOD::Parameter": "my.var1" },
                  MY_VAR2: { "SOMOD::Parameter": "my.var2" }
                }
              }
            }
          },
          AuthLayer: {
            Type: "AWS::Serverless::LayerVersion",
            "SOMOD::Output": {
              default: true,
              attributes: [],
              export: {
                default: "output.var4"
              }
            },
            Properties: {
              LayerName: {
                "SOMOD::ResourceName": "SodaruAuthLayer"
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
                "SOMOD::ResourceName": "GetAuthGroup"
              },
              Description: {
                "Fn::Sub": [
                  "Uses layer ${authLayer}",
                  {
                    authLayer: {
                      "SOMOD::RefResourceName": {
                        resource: "AuthLayer",
                        property: "LayerName"
                      }
                    }
                  }
                ]
              },
              CodeUri: {
                "SOMOD::Function": {
                  name: "getAuthGroup",
                  exclude: ["@sodaru/restapi-sdk"]
                }
              },
              Layers: [
                {
                  "SOMOD::Ref": {
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
          },
          PermissionTable: {
            Type: "AWS::DynamoDB::Table",
            DeletionPolicy: "Retain",
            UpdateReplacePolicy: "Retain"
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

    const result = await generateSAMTemplate(dir);

    expect(result).toEqual({
      Parameters: {
        my: {
          Type: "String"
        }
      },
      Resources: {
        r64967c02baseLayer: {
          Properties: {
            CompatibleArchitectures: ["arm64"],
            CompatibleRuntimes: ["nodejs14.x"],
            RetentionPolicy: "Delete",
            ContentUri: unixStylePath(
              join(
                __dirname,
                "../../../",
                "node_modules",
                "@somod/lambda-base-layer",
                "layer"
              )
            ),
            Description:
              "Set of npm libraries to be required in all Lambda funtions",
            LayerName: {
              "Fn::Sub": [
                "somod${stackId}${moduleHash}${somodResourceName}",
                {
                  moduleHash: "64967c02",
                  somodResourceName: "baseLayer",
                  stackId
                }
              ]
            }
          },
          Type: "AWS::Serverless::LayerVersion"
        },
        r64967c02parameterSpaceCfnLambda: {
          Type: "AWS::Serverless::Function",
          Properties: {
            InlineCode: "THIS_IS_A_PLACE_HOLDER_FOR_ACTUAL_CODE",
            Layers: [{ Ref: "r64967c02baseLayer" }]
          }
        },
        r64967c02pmy: {
          Type: "Custom::ParameterSpace",
          Properties: {
            ServiceToken: {
              "Fn::GetAtt": ["r64967c02parameterSpaceCfnLambda", "Arn"]
            },
            parameters: {
              Ref: "my"
            }
          }
        },
        ra046855cBaseRestApi: {
          Type: "AWS::Serverless::Api",
          Properties: {
            Name: {
              "Fn::Sub": [
                "somod${stackId}${moduleHash}${somodResourceName}",
                {
                  moduleHash: "a046855c",
                  somodResourceName: "rootRestApi",
                  stackId
                }
              ]
            },
            Description: {
              "Fn::Sub": [
                "Extends ${baseApi} in @sodaru/auth-somod",
                {
                  baseApi: {
                    "Fn::Sub": [
                      "somod${stackId}${moduleHash}${somodResourceName}",
                      {
                        moduleHash: "a046855c",
                        somodResourceName: "rootRestApi",
                        stackId
                      }
                    ]
                  }
                }
              ]
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
                  Path: "@sodaru/baseapi/",
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
        rd7ec150dCreateAuthGroupFunction: {
          Properties: {
            CodeUri: unixStylePath(
              join(dir, "build/serverless/functions/createAuthGroup")
            ),
            FunctionName: {
              "Fn::Sub": [
                "somod${stackId}${moduleHash}${somodResourceName}",
                {
                  moduleHash: "d7ec150d",
                  somodResourceName: "CreateAuthGroup",
                  stackId
                }
              ]
            },
            Environment: {
              Variables: {
                MY_VAR1: {
                  "Fn::GetAtt": ["r64967c02pmy", "var1"]
                },
                MY_VAR2: {
                  "Fn::GetAtt": ["r64967c02pmy", "var2"]
                }
              }
            },
            Layers: [{ Ref: "r64967c02baseLayer" }]
          },
          Type: "AWS::Serverless::Function"
        },
        rd7ec150dAuthLayer: {
          Type: "AWS::Serverless::LayerVersion",
          Properties: {
            LayerName: {
              "Fn::Sub": [
                "somod${stackId}${moduleHash}${somodResourceName}",
                {
                  moduleHash: "d7ec150d",
                  somodResourceName: "SodaruAuthLayer",
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
        rd7ec150dGetAuthGroupFunction: {
          Type: "AWS::Serverless::Function",
          Properties: {
            FunctionName: {
              "Fn::Sub": [
                "somod${stackId}${moduleHash}${somodResourceName}",
                {
                  moduleHash: "d7ec150d",
                  somodResourceName: "GetAuthGroup",
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
                      "somod${stackId}${moduleHash}${somodResourceName}",
                      {
                        moduleHash: "d7ec150d",
                        somodResourceName: "SodaruAuthLayer",
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
                Ref: "rd7ec150dAuthLayer"
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
        rd7ec150dListAuthGroupsFunction: {
          Type: "AWS::Serverless::Function",
          Properties: {},
          DependsOn: ["rd7ec150dGetAuthGroupFunction"]
        },
        rd7ec150dPermissionTable: {
          Type: "AWS::DynamoDB::Table",
          DeletionPolicy: "Retain",
          UpdateReplacePolicy: "Retain"
        }
      },
      Outputs: {
        o6f75747075742e76617234: {
          Description: "output.var4",
          Value: {
            Ref: "rd7ec150dAuthLayer"
          }
        },
        o6d792e76617233: {
          Description: "my.var3",
          Value: {
            "Fn::GetAtt": ["ra046855cBaseRestApi", "RootResourceId"]
          }
        }
      }
    });

    expect(existsSync(join(dir, ".somod"))).not.toBeTruthy();
  });
});
