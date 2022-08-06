import { unixStylePath } from "@solib/cli-base";
import { existsSync } from "fs";
import { dump } from "js-yaml";
import { join } from "path";
import { validateSchema } from "../../../src/tasks/serverless/validateSchema";
import { generateSAMTemplate } from "../../../src/utils/serverless/generateSAMTemplate";
import { createFiles, createTempDir, deleteDir } from "../../utils";
import { installSchemaInTempDir } from "./utils";

const templates = [
  {
    Resources: {
      GetAuthGroupFunction: {
        Type: "AWS::Serverless::Function",
        Properties: {
          CodeUri: {
            "SOMOD::Function": {
              name: "getAuthGroup",
              exclude: ["@sodaru/restapi-sdk"]
            }
          }
        }
      }
    }
  },
  {
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
              Type: "HttpApi",
              Properties: {
                Method: "GET",
                Path: "/baseModule/welcome",
                ApiId: { "SOMOD::Ref": { resource: "BaseRestApi" } }
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
  },
  {
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
              Type: "HttpApi",
              Properties: {
                Method: "GET",
                Path: "/baseModule/welcome",
                ApiId: { "SOMOD::Ref": { resource: "BaseRestApi" } }
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
  },
  {
    Resources: {
      CorrectRestApi: {
        Type: "AWS::Serverless::Api",
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
          "SOMOD::FunctionLayerLibraries": ["smallest"]
        }
      },
      GetAuthGroupFunction: {
        Type: "AWS::Serverless::Function",
        Properties: {
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
              Type: "HttpApi",
              Properties: {
                Method: "GET",
                Path: "/authGroup/get",
                ApiId: {
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
        Properties: {
          InlineCode: "waw"
        }
      },
      PermissionTable: {
        Type: "AWS::DynamoDB::Table",
        DeletionPolicy: "Retain",
        UpdateReplacePolicy: "Retain",
        Properties: {}
      }
    }
  }
];

describe("Validate SOMOD Templates before using them to generate SAM Template", () => {
  let dir: string;

  beforeEach(async () => {
    dir = createTempDir();
    await installSchemaInTempDir(dir);
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test.each(templates)("Testing template $#", async template => {
    createFiles(dir, {
      "serverless/template.yaml": dump(template),
      "package.json": JSON.stringify({
        name: "@somod/test-template",
        version: "1.0.0"
      })
    });

    await validateSchema(dir);
  });
});

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
      "serverless/template.yaml": dump(templates[0]),
      "package.json": JSON.stringify({
        name: "@sodaru/auth-somod",
        version: "1.0.0",
        somod: "1.3.2"
      })
    });

    await validateSchema(dir); // makesure the serverless/template is according to latest schema

    await expect(generateSAMTemplate(dir)).resolves.toEqual({
      Resources: {
        r64967c02baseLayer: {
          Properties: {
            CompatibleArchitectures: ["arm64"],
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
        JSON.stringify(templates[1]),
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
                Type: "HttpApi",
                Properties: {
                  Method: "GET",
                  Path: "/baseModule/welcome",
                  ApiId: { Ref: "ra046855cBaseRestApi" }
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
        JSON.stringify(templates[2]),
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
      "parameters.json": JSON.stringify({
        "my.var1": "var1Value",
        "my.var2": ["var", "2", "value"],
        "my.var3": { var3: "value" }
      }),
      "serverless/template.yaml": dump(templates[3]),
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
                Type: "HttpApi",
                Properties: {
                  Method: "GET",
                  Path: "/baseModule/welcome",
                  ApiId: { Ref: "ra046855cBaseRestApi" }
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
            Environment: {
              Variables: {
                MY_VAR1: "var1Value",
                MY_VAR2: ["var", "2", "value"]
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
            RetentionPolicy: "Delete",
            ContentUri: unixStylePath(
              join(
                dir,
                "build",
                "serverless",
                "functionLayers",
                "SodaruAuthLayer"
              )
            )
          }
        },
        rd7ec150dGetAuthGroupFunction: {
          Type: "AWS::Serverless::Function",
          Properties: {
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
                Type: "HttpApi",
                Properties: {
                  Method: "GET",
                  Path: "/authGroup/get",
                  ApiId: {
                    Ref: "ra046855cBaseRestApi"
                  }
                }
              }
            }
          }
        },
        rd7ec150dListAuthGroupsFunction: {
          Type: "AWS::Serverless::Function",
          Properties: { InlineCode: "waw" },
          DependsOn: ["rd7ec150dGetAuthGroupFunction"]
        },
        rd7ec150dPermissionTable: {
          Type: "AWS::DynamoDB::Table",
          DeletionPolicy: "Retain",
          UpdateReplacePolicy: "Retain",
          Properties: {}
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
