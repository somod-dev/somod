import { createFiles, createTempDir, deleteDir } from "@sodev/test-utils";
import { dump } from "js-yaml";
import { ServerlessTemplate } from "../../../../src/utils/serverless-new/types";
import {
  getKeywords,
  getModuleContentMap,
  loadServerlessTemplateMap
} from "../../../../src/utils/serverless-new/serverlessTemplate/serverlessTemplate";
import { join } from "path";

describe("Test util serverlessTemplate", () => {
  let dir: string;

  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("loadServerlessTemplateMap", async () => {
    createFiles(dir, {
      "package.json": JSON.stringify({
        name: "m0",
        somod: "1.0.0",
        dependencies: {
          m1: "^1.0.0",
          m2: "^1.0.0"
        }
      }),
      "serverless/template.yaml": dump({
        Resources: { R0: { Type: "", Properties: {} } }
      } as ServerlessTemplate),
      "node_modules/m1/package.json": JSON.stringify({
        name: "m1",
        somod: "1.0.0",
        dependencies: {
          m2: "^1.0.0",
          m3: "^1.0.0"
        }
      }),
      "node_modules/m2/package.json": JSON.stringify({
        name: "m2",
        somod: "1.0.0",
        dependencies: {}
      }),
      "node_modules/m2/build/serverless/template.json": JSON.stringify({
        Resources: { R2: { Type: "", Properties: {} } }
      } as ServerlessTemplate),
      "node_modules/m3/package.json": JSON.stringify({
        name: "m3",
        somod: "1.0.0",
        dependencies: {}
      }),
      "node_modules/m3/build/serverless/template.json": JSON.stringify({
        Resources: { R3: { Type: "", Properties: {} } }
      } as ServerlessTemplate)
    });

    const result = await loadServerlessTemplateMap([
      {
        name: "m0",
        namespaces: {},
        type: "somod",
        version: "1.0.0",
        packageLocation: dir,
        root: true
      },
      {
        name: "m1",
        namespaces: {},
        type: "somod",
        version: "1.0.0",
        packageLocation: join(dir, "node_modules/m1")
      },
      {
        name: "m2",
        namespaces: {},
        type: "somod",
        version: "1.0.0",
        packageLocation: join(dir, "node_modules/m2")
      },
      {
        name: "m3",
        namespaces: {},
        type: "somod",
        version: "1.0.0",
        packageLocation: join(dir, "node_modules/m3")
      }
    ]);

    expect(result).toEqual({
      m0: {
        module: "m0",
        packageLocation: dir,
        root: true,
        template: {
          Resources: {
            R0: {
              Type: "",
              Properties: {}
            }
          }
        }
      },

      m2: {
        module: "m2",
        packageLocation: join(dir, "node_modules/m2"),
        root: undefined,
        template: {
          Resources: {
            R2: {
              Type: "",
              Properties: {}
            }
          }
        }
      },

      m3: {
        module: "m3",
        packageLocation: join(dir, "node_modules/m3"),
        root: undefined,
        template: {
          Resources: {
            R3: {
              Type: "",
              Properties: {}
            }
          }
        }
      }
    });
  });

  test("getModuleContentMap", () => {
    expect(
      getModuleContentMap({
        m0: {
          module: "m0",
          packageLocation: dir,
          root: true,
          template: {
            Resources: {
              R0: {
                Type: "",
                Properties: {}
              }
            }
          }
        },

        m2: {
          module: "m2",
          packageLocation: join(dir, "node_modules/m2"),
          root: undefined,
          template: {
            Resources: {
              R2: {
                Type: "",
                Properties: {}
              }
            }
          }
        },

        m3: {
          module: "m3",
          packageLocation: join(dir, "node_modules/m3"),
          root: undefined,
          template: {
            Resources: {
              R3: {
                Type: "",
                Properties: {}
              }
            }
          }
        }
      })
    ).toEqual({
      m0: {
        json: {
          Resources: {
            R0: {
              Properties: {},
              Type: ""
            }
          }
        },
        location: dir,
        moduleName: "m0",
        path: "serverless/template.yaml"
      },
      m2: {
        json: {
          Resources: {
            R2: {
              Properties: {},
              Type: ""
            }
          }
        },
        location: join(dir, "node_modules/m2"),
        moduleName: "m2",
        path: "build/serverless/template.json"
      },
      m3: {
        json: {
          Resources: {
            R3: {
              Properties: {},
              Type: ""
            }
          }
        },
        location: join(dir, "node_modules/m3"),
        moduleName: "m3",
        path: "build/serverless/template.json"
      }
    });
  });

  test("getKeywords", () => {
    const keywords = getKeywords();
    expect(keywords.length).toEqual(20);
  });
});
