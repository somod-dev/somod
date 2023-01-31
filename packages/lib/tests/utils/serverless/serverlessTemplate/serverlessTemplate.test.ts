import { createFiles, createTempDir, deleteDir } from "../../../utils";
import { dump } from "js-yaml";
import {
  getBaseKeywords,
  ServerlessTemplateHandler
} from "../../../../src/utils/serverless/serverlessTemplate/serverlessTemplate";
import { join } from "path";
import { IContext, ServerlessTemplate } from "somod-types";
import { createHash } from "crypto";

describe("Test util serverlessTemplate.getBaseKeywords", () => {
  test("getBaseKeywords", () => {
    const keywords = getBaseKeywords();
    expect(keywords.length).toEqual(22);
  });
});

describe("Test util serverlessTemplate.ServerlessTemplateHandler.<instanceMethods>", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir("test-somod-lib");
    ServerlessTemplateHandler["instance"] = undefined; // reset ServerlessHandler everytime
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("getTemplate for unknown module", async () => {
    createFiles(dir, {
      "serverless/template.yaml": dump({
        Resources: { R0: { Type: "T0", Properties: {} } }
      } as ServerlessTemplate)
    });

    const serverlessTemplateHandler =
      await ServerlessTemplateHandler.getInstance({
        moduleHandler: {
          list: [{ module: { name: "m0", packageLocation: dir, root: true } }]
        }
      } as IContext);

    expect(serverlessTemplateHandler.getTemplate("my-module")).toBeNull();
  });

  test("getTemplate for root module", async () => {
    createFiles(dir, {
      "serverless/template.yaml": dump({
        Resources: { R0: { Type: "T0", Properties: {} } }
      } as ServerlessTemplate),
      "node_modules/m1/build/serverless/template.json": JSON.stringify({
        Resources: { R1: { Type: "T1", Properties: {} } }
      } as ServerlessTemplate)
    });

    const serverlessTemplateHandler =
      await ServerlessTemplateHandler.getInstance({
        moduleHandler: {
          list: [
            { module: { name: "m0", packageLocation: dir, root: true } },
            {
              module: {
                name: "m1",
                packageLocation: join(dir, "node_modules/m1")
              }
            }
          ]
        }
      } as IContext);

    expect(serverlessTemplateHandler.getTemplate("m0")).toEqual({
      module: "m0",
      template: { Resources: { R0: { Type: "T0", Properties: {} } } }
    });
  });

  test("getTemplate for one level child module", async () => {
    createFiles(dir, {
      "serverless/template.yaml": dump({
        Resources: { R0: { Type: "T0", Properties: {} } }
      } as ServerlessTemplate),
      "node_modules/m1/build/serverless/template.json": JSON.stringify({
        Resources: { R1: { Type: "T1", Properties: {} } }
      } as ServerlessTemplate)
    });

    const serverlessTemplateHandler =
      await ServerlessTemplateHandler.getInstance({
        moduleHandler: {
          list: [
            { module: { name: "m0", packageLocation: dir, root: true } },
            {
              module: {
                name: "m1",
                packageLocation: join(dir, "node_modules/m1")
              }
            }
          ]
        }
      } as IContext);

    expect(serverlessTemplateHandler.getTemplate("m1")).toEqual({
      module: "m1",
      template: { Resources: { R1: { Type: "T1", Properties: {} } } }
    });
  });

  test("getTemplate for two level child module", async () => {
    createFiles(dir, {
      "serverless/template.yaml": dump({
        Resources: { R0: { Type: "T0", Properties: {} } }
      } as ServerlessTemplate),
      "node_modules/m1/build/serverless/template.json": JSON.stringify({
        Resources: { R1: { Type: "T1", Properties: {} } }
      } as ServerlessTemplate),
      "node_modules/m1/node_modules/m1-1/build/serverless/template.json":
        JSON.stringify({
          Resources: { R11: { Type: "T1", Properties: {} } }
        } as ServerlessTemplate)
    });

    const serverlessTemplateHandler =
      await ServerlessTemplateHandler.getInstance({
        moduleHandler: {
          list: [
            { module: { name: "m0", packageLocation: dir, root: true } },
            {
              module: {
                name: "m1",
                packageLocation: join(dir, "node_modules/m1")
              }
            },
            {
              module: {
                name: "m1-1",
                packageLocation: join(dir, "node_modules/m1/node_modules/m1-1")
              }
            }
          ]
        }
      } as IContext);

    expect(serverlessTemplateHandler.getTemplate("m1-1")).toEqual({
      module: "m1-1",
      template: { Resources: { R11: { Type: "T1", Properties: {} } } }
    });
  });

  test("listTemplates and getResource", async () => {
    createFiles(dir, {
      "serverless/template.yaml": dump({
        Resources: {
          R0: { Type: "T0", Properties: {} },
          R1: {
            Type: "T1",
            "SOMOD::Extend": { module: "m1", resource: "R1" },
            Properties: { P1: "from-m0", P2: ["from-m0"], P3: { from: "m0" } }
          }
        }
      } as ServerlessTemplate),
      "node_modules/m1/build/serverless/template.json": JSON.stringify({
        Resources: {
          R0: { Type: "T1", Properties: { P1: "from-m1" } },
          R1: {
            Type: "T1",
            "SOMOD::Extend": { module: "m1-1", resource: "R11" },
            Properties: {
              P1: "from-m1",
              P2: ["from-m1"],
              P3: { from: "m1", another: "m1" },
              P4: "from-m1",
              P5: ["from-m1"],
              P6: { from: "m1" }
            }
          }
        }
      } as ServerlessTemplate),
      "node_modules/m1/node_modules/m1-1/build/serverless/template.json":
        JSON.stringify({
          Resources: {
            R0: { Type: "T1", Properties: { P1: "from-m1-1" } },
            R11: {
              Type: "T1",
              Properties: {
                P1: "from-m1-1",
                P2: ["from-m1-1"],
                P3: { from: "m1-1" },
                P4: "from-m1-1",
                P5: ["from-m1-1"],
                P6: { from: "m1-1" },
                P7: "from-m1-1",
                P8: ["from-m1-1"],
                P9: { from: "m1-1" }
              }
            }
          }
        } as ServerlessTemplate),
      "node_modules/m2/build/serverless/template.json": JSON.stringify({
        Resources: { R2: { Type: "T2", Properties: { P: "hi" } } }
      } as ServerlessTemplate)
    });

    const serverlessTemplateHandler =
      await ServerlessTemplateHandler.getInstance({
        moduleHandler: {
          list: [
            { module: { name: "m0", packageLocation: dir, root: true } },
            {
              module: {
                name: "m1",
                packageLocation: join(dir, "node_modules/m1")
              }
            },
            {
              module: {
                name: "m1-1",
                packageLocation: join(dir, "node_modules/m1/node_modules/m1-1")
              }
            },
            {
              module: {
                name: "m2",
                packageLocation: join(dir, "node_modules/m2")
              }
            }
          ]
        }
      } as IContext);

    expect(serverlessTemplateHandler.listTemplates()).toEqual([
      {
        module: "m0",
        template: {
          Resources: {
            R0: { Properties: {}, Type: "T0" },
            R1: {
              Properties: {
                P1: "from-m0",
                P2: ["from-m0"],
                P3: { from: "m0" }
              },
              "SOMOD::Extend": { module: "m1", resource: "R1" },
              Type: "T1"
            }
          }
        }
      },
      {
        module: "m1",
        template: {
          Resources: {
            R0: { Properties: { P1: "from-m1" }, Type: "T1" },
            R1: {
              Properties: {
                P1: "from-m1",
                P2: ["from-m1"],
                P3: { another: "m1", from: "m1" },
                P4: "from-m1",
                P5: ["from-m1"],
                P6: { from: "m1" }
              },
              "SOMOD::Extend": { module: "m1-1", resource: "R11" },
              Type: "T1"
            }
          }
        }
      },
      {
        module: "m1-1",
        template: {
          Resources: {
            R0: { Properties: { P1: "from-m1-1" }, Type: "T1" },
            R11: {
              Properties: {
                P1: "from-m1-1",
                P2: ["from-m1-1"],
                P3: { from: "m1-1" },
                P4: "from-m1-1",
                P5: ["from-m1-1"],
                P6: { from: "m1-1" },
                P7: "from-m1-1",
                P8: ["from-m1-1"],
                P9: { from: "m1-1" }
              },
              Type: "T1"
            }
          }
        }
      },
      {
        module: "m2",
        template: {
          Resources: {
            R2: { Properties: { P: "hi" }, Type: "T2" }
          }
        }
      }
    ]);

    expect(serverlessTemplateHandler.getResource("m", "R")).toBeNull();
    expect(serverlessTemplateHandler.getResource("m0", "R")).toBeNull();
    expect(serverlessTemplateHandler.getResource("m0", "R0"))
      .toMatchInlineSnapshot(`
      Object {
        "propertySourceMap": Object {
          "children": Object {},
          "module": "m0",
          "resource": "R0",
        },
        "resource": Object {
          "Properties": Object {},
          "Type": "T0",
        },
      }
    `);
    const expectedResource = {
      propertySourceMap: {
        children: {
          P1: { children: {}, module: "m0", resource: "R1" },
          P2: {
            children: {
              "0": { children: {}, module: "m0", resource: "R1" }
            },
            module: "m1-1",
            resource: "R11"
          },
          P3: {
            children: {
              another: { children: {}, module: "m1", resource: "R1" },
              from: { children: {}, module: "m0", resource: "R1" }
            },
            module: "m1-1",
            resource: "R11"
          },
          P4: { children: {}, module: "m1", resource: "R1" },
          P5: {
            children: {
              "0": { children: {}, module: "m1", resource: "R1" }
            },
            module: "m1-1",
            resource: "R11"
          },
          P6: {
            children: {
              from: { children: {}, module: "m1", resource: "R1" }
            },
            module: "m1-1",
            resource: "R11"
          }
        },
        module: "m1-1",
        resource: "R11"
      },
      resource: {
        Properties: {
          P1: "from-m0",
          P2: ["from-m0"],
          P3: { another: "m1", from: "m0" },
          P4: "from-m1",
          P5: ["from-m1"],
          P6: { from: "m1" },
          P7: "from-m1-1",
          P8: ["from-m1-1"],
          P9: { from: "m1-1" }
        },
        Type: "T1"
      }
    };
    expect(serverlessTemplateHandler.getResource("m0", "R1")).toEqual(
      expectedResource
    );
    expect(serverlessTemplateHandler.getResource("m1", "R0"))
      .toMatchInlineSnapshot(`
      Object {
        "propertySourceMap": Object {
          "children": Object {},
          "module": "m1",
          "resource": "R0",
        },
        "resource": Object {
          "Properties": Object {
            "P1": "from-m1",
          },
          "Type": "T1",
        },
      }
    `);
    expect(serverlessTemplateHandler.getResource("m1", "R1")).toEqual(
      expectedResource
    );
    expect(serverlessTemplateHandler.getResource("m1-1", "R0"))
      .toMatchInlineSnapshot(`
      Object {
        "propertySourceMap": Object {
          "children": Object {},
          "module": "m1-1",
          "resource": "R0",
        },
        "resource": Object {
          "Properties": Object {
            "P1": "from-m1-1",
          },
          "Type": "T1",
        },
      }
    `);
    expect(serverlessTemplateHandler.getResource("m1-1", "R11")).toEqual(
      expectedResource
    );
    expect(serverlessTemplateHandler.getResource("m2", "R2"))
      .toMatchInlineSnapshot(`
      Object {
        "propertySourceMap": Object {
          "children": Object {},
          "module": "m2",
          "resource": "R2",
        },
        "resource": Object {
          "Properties": Object {
            "P": "hi",
          },
          "Type": "T2",
        },
      }
    `);

    expect(
      serverlessTemplateHandler.getResourcePropertySource(
        ["$", "P3", "from"],
        expectedResource.propertySourceMap
      )
    ).toEqual({ depth: 1, module: "m0", resource: "R1" });
    expect(
      serverlessTemplateHandler.getResourcePropertySource(
        ["$", "P3", "another"],
        expectedResource.propertySourceMap
      )
    ).toEqual({ depth: 1, module: "m1", resource: "R1" });
    expect(
      serverlessTemplateHandler.getResourcePropertySource(
        ["$", "P3", "another", "deep-path"],
        expectedResource.propertySourceMap
      )
    ).toEqual({ depth: 1, module: "m1", resource: "R1" });
    expect(
      serverlessTemplateHandler.getResourcePropertySource(
        ["$", "P4"],
        expectedResource.propertySourceMap
      )
    ).toEqual({ depth: 0, module: "m1", resource: "R1" });
    expect(
      serverlessTemplateHandler.getResourcePropertySource(
        ["$", "P9", "from"],
        expectedResource.propertySourceMap
      )
    ).toEqual({ depth: -1, module: "m1-1", resource: "R11" });
  });

  test("test serverlessTemplateHandler utilities", async () => {
    const serverlessTemplateHandler =
      await ServerlessTemplateHandler.getInstance({
        moduleHandler: {
          list: [{ module: { name: "m0", packageLocation: dir, root: true } }]
        },
        getModuleHash: moduleName =>
          createHash("sha256").update(moduleName).digest("hex").substring(0, 8)
      } as IContext);

    expect(serverlessTemplateHandler.functionNodeRuntimeVersion).toEqual("16");
    expect(
      serverlessTemplateHandler.getSAMResourceLogicalId("m1", "r1")
    ).toEqual("rca0df2c9r1");
    expect(serverlessTemplateHandler.getSAMResourceName("m1", "r1")).toEqual({
      "Fn::Sub": [
        "somod${stackId}${moduleHash}${somodResourceName}",
        {
          moduleHash: "ca0df2c9",
          somodResourceName: "r1",
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
    });
    expect(serverlessTemplateHandler.getSAMOutputName("my.param1")).toEqual(
      "o6d792e706172616d31"
    );
    expect(
      serverlessTemplateHandler.getParameterNameFromSAMOutputName(
        "o6d792e706172616d31"
      )
    ).toEqual("my.param1");
  });
});
