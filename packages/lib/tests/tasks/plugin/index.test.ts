import { mockedFunction } from "../../utils";
import { loadPlugins as loadPluginsUtil } from "../../../src/utils/plugin/loadPlugins";
import { loadPlugins } from "../../../src";

jest.mock("../../../src/utils/plugin/loadPlugins", () => {
  return {
    __esmodule: true,
    loadPlugins: jest.fn()
  };
});

describe("Test task loadPlugins", () => {
  beforeEach(() => {
    mockedFunction(loadPluginsUtil).mockReset();
  });

  test("empty plugins", async () => {
    mockedFunction(loadPluginsUtil).mockResolvedValue([]);
    await expect(loadPlugins("")).resolves.toEqual({
      namespaceLoaders: [],
      uiKeywords: [],
      serverlessKeywords: [],
      prebuild: [],
      build: [],
      preprepare: [],
      prepare: [],
      tsconfig: { compilerOptions: {}, include: [] },
      ignorePatterns: { git: [], eslint: [], prettier: [] }
    });
  });

  test("single plugin", async () => {
    const plugins: Awaited<ReturnType<typeof loadPluginsUtil>> = [
      {
        name: "somod-plugin1",
        plugin: {
          namespaceLoader: jest.fn(),
          keywords: {
            uiConfig: [
              {
                keyword: "SOMOD::UIKey1",
                getProcessor: jest.fn(),
                getValidator: jest.fn()
              }
            ],
            serverless: [
              {
                keyword: "SOMOD::ServerlessKey1",
                getProcessor: jest.fn(),
                getValidator: jest.fn()
              }
            ]
          },
          prebuild: jest.fn(),
          build: jest.fn(),
          preprepare: jest.fn(),
          prepare: jest.fn(),
          tsconfig: {
            compilerOptions: {
              lib: ["DOM"]
            },
            include: ["widgets"]
          },
          ignorePatterns: {
            git: [".vercel"]
          }
        }
      }
    ];
    mockedFunction(loadPluginsUtil).mockResolvedValue(plugins);
    await expect(loadPlugins("")).resolves.toEqual({
      namespaceLoaders: plugins.map(p => p.plugin.namespaceLoader),
      uiKeywords: [plugins[0].plugin.keywords.uiConfig[0]],
      serverlessKeywords: [plugins[0].plugin.keywords.serverless[0]],
      prebuild: plugins,
      build: plugins,
      preprepare: plugins,
      prepare: plugins,
      tsconfig: plugins[0].plugin.tsconfig,
      ignorePatterns: { git: [".vercel"], eslint: [], prettier: [] }
    });
  });

  test("multiple plugins", async () => {
    const plugins: Awaited<ReturnType<typeof loadPluginsUtil>> = [
      {
        name: "somod-plugin1",
        plugin: {
          keywords: {
            uiConfig: [
              {
                keyword: "SOMOD::UIKey1",
                getProcessor: jest.fn(),
                getValidator: jest.fn()
              }
            ]
          },
          prebuild: jest.fn(),
          preprepare: jest.fn(),
          prepare: jest.fn(),
          tsconfig: {
            compilerOptions: {
              lib: ["DOM"]
            },
            include: ["widgets"]
          },
          ignorePatterns: { eslint: ["path1"], prettier: [] }
        }
      },
      {
        name: "somod-plugin2",
        plugin: {
          namespaceLoader: jest.fn(),
          prebuild: jest.fn(),
          build: jest.fn(),
          prepare: jest.fn(),
          tsconfig: {
            compilerOptions: {
              lib: ["DOM", "ESNext"]
            },
            include: ["schemas"]
          }
        }
      },
      {
        name: "somod-plugin3",
        plugin: {
          keywords: {
            uiConfig: [
              {
                keyword: "SOMOD::UIKey2",
                getProcessor: jest.fn(),
                getValidator: jest.fn()
              }
            ],
            serverless: [
              {
                keyword: "SOMOD::ServerlessKey1",
                getProcessor: jest.fn(),
                getValidator: jest.fn()
              }
            ]
          },
          prebuild: jest.fn(),
          build: jest.fn(),
          preprepare: jest.fn(),
          prepare: jest.fn(),
          ignorePatterns: {
            git: ["path1", "path2"],
            eslint: ["path1"],
            prettier: ["path1", "pathx"]
          }
        }
      }
    ];
    mockedFunction(loadPluginsUtil).mockResolvedValue(plugins);
    await expect(loadPlugins("")).resolves.toEqual({
      namespaceLoaders: [plugins[1].plugin.namespaceLoader],
      uiKeywords: [
        plugins[0].plugin.keywords.uiConfig[0],
        plugins[2].plugin.keywords.uiConfig[0]
      ],
      serverlessKeywords: [plugins[2].plugin.keywords.serverless[0]],
      prebuild: [plugins[2], plugins[1], plugins[0]],
      build: [plugins[1], plugins[2]],
      preprepare: [plugins[2], plugins[0]],
      prepare: [plugins[0], plugins[1], plugins[2]],
      tsconfig: {
        compilerOptions: {
          lib: ["DOM", "ESNext"]
        },
        include: ["widgets", "schemas"]
      },
      ignorePatterns: {
        git: ["path1", "path2"],
        eslint: ["path1", "path1"],
        prettier: ["path1", "pathx"]
      }
    });
  });
});
