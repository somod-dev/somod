import {
  createFiles,
  createTempDir,
  deleteDir,
  mockedFunction
} from "../../../utils";
import { dump } from "js-yaml";
import {
  getBaseKeywords,
  ServerlessTemplateHandler
} from "../../../../src/utils/serverless/serverlessTemplate/serverlessTemplate";
import { join } from "path";
import { ModuleHandler } from "../../../../src/utils/moduleHandler";
import { IModuleHandler, ServerlessTemplate } from "somod-types";

jest.mock("../../../../src/utils/moduleHandler", () => {
  return {
    __esModule: true,
    ModuleHandler: {
      getModuleHandler: jest.fn()
    }
  };
});

describe("Test util serverlessTemplate.getBaseKeywords", () => {
  test("getBaseKeywords", () => {
    const keywords = getBaseKeywords();
    expect(keywords.length).toEqual(22);
  });
});

describe("Test util serverlessTemplate.ServerlessTemplateHandler.getServerlessTemplateHandler", () => {
  beforeEach(() => {
    mockedFunction(ModuleHandler.getModuleHandler).mockReset();
  });

  test("without explicit ModuleHandler", () => {
    expect(
      ServerlessTemplateHandler.getServerlessTemplateHandler() instanceof
        ServerlessTemplateHandler
    ).toBeTruthy();

    expect(ModuleHandler.getModuleHandler).toHaveBeenCalledTimes(1);
    expect(ModuleHandler.getModuleHandler).toHaveBeenCalledWith();
  });

  test("with explicit ModuleHandler", () => {
    expect(
      ServerlessTemplateHandler.getServerlessTemplateHandler(
        {} as IModuleHandler
      ) instanceof ServerlessTemplateHandler
    ).toBeTruthy();

    expect(ModuleHandler.getModuleHandler).toHaveBeenCalledTimes(0);
  });
});

describe("Test util serverlessTemplate.ServerlessTemplateHandler.<instanceMethods>", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir("test-somod-lib");
    ServerlessTemplateHandler["handler"] = undefined; // reset ServerlessHandler everytime
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
    mockedFunction(ModuleHandler.getModuleHandler).mockReturnValue({
      listModules: async () => [
        { module: { name: "m0", packageLocation: dir, root: true } }
      ]
    } as ModuleHandler);
    const serverlessTemplateHandler =
      ServerlessTemplateHandler.getServerlessTemplateHandler();

    await expect(
      serverlessTemplateHandler.getTemplate("my-module")
    ).resolves.toBeNull();
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
    mockedFunction(ModuleHandler.getModuleHandler).mockReturnValue({
      listModules: async () => [
        { module: { name: "m0", packageLocation: dir, root: true } },
        {
          module: { name: "m1", packageLocation: join(dir, "node_modules/m1") }
        }
      ]
    } as ModuleHandler);
    const serverlessTemplateHandler =
      ServerlessTemplateHandler.getServerlessTemplateHandler();

    await expect(serverlessTemplateHandler.getTemplate("m0")).resolves.toEqual({
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
    mockedFunction(ModuleHandler.getModuleHandler).mockReturnValue({
      listModules: async () => [
        { module: { name: "m0", packageLocation: dir, root: true } },
        {
          module: { name: "m1", packageLocation: join(dir, "node_modules/m1") }
        }
      ]
    } as ModuleHandler);
    const serverlessTemplateHandler =
      ServerlessTemplateHandler.getServerlessTemplateHandler();
    await expect(serverlessTemplateHandler.getTemplate("m1")).resolves.toEqual({
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
    mockedFunction(ModuleHandler.getModuleHandler).mockReturnValue({
      listModules: async () => [
        { module: { name: "m0", packageLocation: dir, root: true } },
        {
          module: { name: "m1", packageLocation: join(dir, "node_modules/m1") }
        },
        {
          module: {
            name: "m1-1",
            packageLocation: join(dir, "node_modules/m1/node_modules/m1-1")
          }
        }
      ]
    } as ModuleHandler);
    const serverlessTemplateHandler =
      ServerlessTemplateHandler.getServerlessTemplateHandler();
    await expect(
      serverlessTemplateHandler.getTemplate("m1-1")
    ).resolves.toEqual({
      module: "m1-1",
      template: { Resources: { R11: { Type: "T1", Properties: {} } } }
    });
  });

  test("listTemplates", async () => {
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
    mockedFunction(ModuleHandler.getModuleHandler).mockReturnValue({
      listModules: async () => [
        { module: { name: "m0", packageLocation: dir, root: true } },
        {
          module: { name: "m1", packageLocation: join(dir, "node_modules/m1") }
        },
        {
          module: {
            name: "m1-1",
            packageLocation: join(dir, "node_modules/m1/node_modules/m1-1")
          }
        },
        {
          module: { name: "m2", packageLocation: join(dir, "node_modules/m2") }
        }
      ]
    } as ModuleHandler);
    const serverlessTemplateHandler =
      ServerlessTemplateHandler.getServerlessTemplateHandler();

    await expect(serverlessTemplateHandler.listTemplates()).resolves.toEqual([
      {
        module: "m0",
        template: {
          Resources: {
            R0: {
              Properties: {},
              Type: "T0"
            },
            R1: {
              Properties: {
                P1: "from-m0",
                P2: ["from-m0"],
                P3: {
                  from: "m0"
                }
              },
              "SOMOD::Extend": {
                module: "m1",
                resource: "R1"
              },
              Type: "T1"
            }
          }
        }
      },
      {
        module: "m1",
        template: {
          Resources: {
            R0: {
              Properties: {
                P1: "from-m1"
              },
              Type: "T1"
            },
            R1: {
              Properties: {
                P1: "from-m1",
                P2: ["from-m1"],
                P3: {
                  another: "m1",
                  from: "m1"
                },
                P4: "from-m1",
                P5: ["from-m1"],
                P6: {
                  from: "m1"
                }
              },
              "SOMOD::Extend": {
                module: "m1-1",
                resource: "R11"
              },
              Type: "T1"
            }
          }
        }
      },
      {
        module: "m1-1",
        template: {
          Resources: {
            R0: {
              Properties: {
                P1: "from-m1-1"
              },
              Type: "T1"
            },
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
            R2: {
              Properties: {
                P: "hi"
              },
              Type: "T2"
            }
          }
        }
      }
    ]);
  });

  /*
  test("getResourceExtendMap", async () => {
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
        } as ServerlessTemplate)
    });
    mockedFunction(ModuleHandler.getModuleHandler).mockReturnValue({
      listModules: async () => [
        { module: { name: "m0", packageLocation: dir, root: true } },
        {
          module: { name: "m1", packageLocation: join(dir, "node_modules/m1") }
        },
        {
          module: {
            name: "m1-1",
            packageLocation: join(dir, "node_modules/m1/node_modules/m1-1")
          }
        }
      ]
    } as ModuleHandler);
    const serverlessTemplateHandler =
      ServerlessTemplateHandler.getServerlessTemplateHandler();

    await expect(
      serverlessTemplateHandler.getResourceExtendMap("m100", "R1") // unknown module
    ).resolves.toBeNull();

    await expect(
      serverlessTemplateHandler.getResourceExtendMap("m0", "R100") // unknown resource
    ).resolves.toBeNull();

    await expect(serverlessTemplateHandler.getResourceExtendMap("m0", "R0"))
      .resolves.toMatchInlineSnapshot(`
      Object {
        "from": Array [],
        "module": "m0",
        "resource": "R0",
      }
    `);

    await expect(serverlessTemplateHandler.getResourceExtendMap("m0", "R1"))
      .resolves.toMatchInlineSnapshot(`
      Object {
        "from": Array [
          Object {
            "from": Array [
              Object {
                "from": Array [],
                "module": "m0",
                "resource": "R1",
              },
            ],
            "module": "m1",
            "resource": "R1",
          },
        ],
        "module": "m1-1",
        "resource": "R11",
      }
    `);

    await expect(serverlessTemplateHandler.getResourceExtendMap("m1", "R0"))
      .resolves.toMatchInlineSnapshot(`
      Object {
        "from": Array [],
        "module": "m1",
        "resource": "R0",
      }
    `);

    await expect(serverlessTemplateHandler.getResourceExtendMap("m1", "R1"))
      .resolves.toMatchInlineSnapshot(`
      Object {
        "from": Array [
          Object {
            "from": Array [
              Object {
                "from": Array [],
                "module": "m0",
                "resource": "R1",
              },
            ],
            "module": "m1",
            "resource": "R1",
          },
        ],
        "module": "m1-1",
        "resource": "R11",
      }
    `);

    await expect(serverlessTemplateHandler.getResourceExtendMap("m1-1", "R0"))
      .resolves.toMatchInlineSnapshot(`
      Object {
        "from": Array [],
        "module": "m1-1",
        "resource": "R0",
      }
    `);

    await expect(serverlessTemplateHandler.getResourceExtendMap("m1-1", "R11"))
      .resolves.toMatchInlineSnapshot(`
      Object {
        "from": Array [
          Object {
            "from": Array [
              Object {
                "from": Array [],
                "module": "m0",
                "resource": "R1",
              },
            ],
            "module": "m1",
            "resource": "R1",
          },
        ],
        "module": "m1-1",
        "resource": "R11",
      }
    `);
  }); */
});
