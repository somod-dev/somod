import { createFiles, createTempDir, deleteDir } from "../../../utils";
import { dump } from "js-yaml";
import {
  getBaseKeywords,
  ServerlessTemplateHandler
} from "../../../../src/utils/serverless/serverlessTemplate/serverlessTemplate";
import { join } from "path";
import { IContext, ServerlessTemplate } from "somod-types";

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
    expect(serverlessTemplateHandler.getResource("m0", "R1"))
      .toMatchInlineSnapshot(`
      Object {
        "propertySourceMap": Object {
          "children": Object {
            "P1": Object {
              "children": Object {},
              "module": "m0",
              "resource": "R1",
            },
            "P2": Object {
              "children": Object {
                "0": Object {
                  "children": Object {},
                  "module": "m0",
                  "resource": "R1",
                },
              },
              "module": "m1-1",
              "resource": "R11",
            },
            "P3": Object {
              "children": Object {
                "another": Object {
                  "children": Object {},
                  "module": "m1",
                  "resource": "R1",
                },
                "from": Object {
                  "children": Object {},
                  "module": "m0",
                  "resource": "R1",
                },
              },
              "module": "m1-1",
              "resource": "R11",
            },
            "P4": Object {
              "children": Object {},
              "module": "m1",
              "resource": "R1",
            },
            "P5": Object {
              "children": Object {
                "0": Object {
                  "children": Object {},
                  "module": "m1",
                  "resource": "R1",
                },
              },
              "module": "m1-1",
              "resource": "R11",
            },
            "P6": Object {
              "children": Object {
                "from": Object {
                  "children": Object {},
                  "module": "m1",
                  "resource": "R1",
                },
              },
              "module": "m1-1",
              "resource": "R11",
            },
          },
          "module": "m1-1",
          "resource": "R11",
        },
        "resource": Object {
          "Properties": Object {
            "P1": "from-m0",
            "P2": Array [
              "from-m0",
            ],
            "P3": Object {
              "another": "m1",
              "from": "m0",
            },
            "P4": "from-m1",
            "P5": Array [
              "from-m1",
            ],
            "P6": Object {
              "from": "m1",
            },
            "P7": "from-m1-1",
            "P8": Array [
              "from-m1-1",
            ],
            "P9": Object {
              "from": "m1-1",
            },
          },
          "Type": "T1",
        },
      }
    `);
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
    expect(serverlessTemplateHandler.getResource("m1", "R1"))
      .toMatchInlineSnapshot(`
      Object {
        "propertySourceMap": Object {
          "children": Object {
            "P1": Object {
              "children": Object {},
              "module": "m0",
              "resource": "R1",
            },
            "P2": Object {
              "children": Object {
                "0": Object {
                  "children": Object {},
                  "module": "m0",
                  "resource": "R1",
                },
              },
              "module": "m1-1",
              "resource": "R11",
            },
            "P3": Object {
              "children": Object {
                "another": Object {
                  "children": Object {},
                  "module": "m1",
                  "resource": "R1",
                },
                "from": Object {
                  "children": Object {},
                  "module": "m0",
                  "resource": "R1",
                },
              },
              "module": "m1-1",
              "resource": "R11",
            },
            "P4": Object {
              "children": Object {},
              "module": "m1",
              "resource": "R1",
            },
            "P5": Object {
              "children": Object {
                "0": Object {
                  "children": Object {},
                  "module": "m1",
                  "resource": "R1",
                },
              },
              "module": "m1-1",
              "resource": "R11",
            },
            "P6": Object {
              "children": Object {
                "from": Object {
                  "children": Object {},
                  "module": "m1",
                  "resource": "R1",
                },
              },
              "module": "m1-1",
              "resource": "R11",
            },
          },
          "module": "m1-1",
          "resource": "R11",
        },
        "resource": Object {
          "Properties": Object {
            "P1": "from-m0",
            "P2": Array [
              "from-m0",
            ],
            "P3": Object {
              "another": "m1",
              "from": "m0",
            },
            "P4": "from-m1",
            "P5": Array [
              "from-m1",
            ],
            "P6": Object {
              "from": "m1",
            },
            "P7": "from-m1-1",
            "P8": Array [
              "from-m1-1",
            ],
            "P9": Object {
              "from": "m1-1",
            },
          },
          "Type": "T1",
        },
      }
    `);
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
    expect(serverlessTemplateHandler.getResource("m1-1", "R11"))
      .toMatchInlineSnapshot(`
      Object {
        "propertySourceMap": Object {
          "children": Object {
            "P1": Object {
              "children": Object {},
              "module": "m0",
              "resource": "R1",
            },
            "P2": Object {
              "children": Object {
                "0": Object {
                  "children": Object {},
                  "module": "m0",
                  "resource": "R1",
                },
              },
              "module": "m1-1",
              "resource": "R11",
            },
            "P3": Object {
              "children": Object {
                "another": Object {
                  "children": Object {},
                  "module": "m1",
                  "resource": "R1",
                },
                "from": Object {
                  "children": Object {},
                  "module": "m0",
                  "resource": "R1",
                },
              },
              "module": "m1-1",
              "resource": "R11",
            },
            "P4": Object {
              "children": Object {},
              "module": "m1",
              "resource": "R1",
            },
            "P5": Object {
              "children": Object {
                "0": Object {
                  "children": Object {},
                  "module": "m1",
                  "resource": "R1",
                },
              },
              "module": "m1-1",
              "resource": "R11",
            },
            "P6": Object {
              "children": Object {
                "from": Object {
                  "children": Object {},
                  "module": "m1",
                  "resource": "R1",
                },
              },
              "module": "m1-1",
              "resource": "R11",
            },
          },
          "module": "m1-1",
          "resource": "R11",
        },
        "resource": Object {
          "Properties": Object {
            "P1": "from-m0",
            "P2": Array [
              "from-m0",
            ],
            "P3": Object {
              "another": "m1",
              "from": "m0",
            },
            "P4": "from-m1",
            "P5": Array [
              "from-m1",
            ],
            "P6": Object {
              "from": "m1",
            },
            "P7": "from-m1-1",
            "P8": Array [
              "from-m1-1",
            ],
            "P9": Object {
              "from": "m1-1",
            },
          },
          "Type": "T1",
        },
      }
    `);
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
  });
});
