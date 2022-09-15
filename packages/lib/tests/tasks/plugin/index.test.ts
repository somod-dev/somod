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
      prepare: []
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
          prepare: jest.fn()
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
      prepare: plugins
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
          prepare: jest.fn()
        }
      },
      {
        name: "somod-plugin2",
        plugin: {
          namespaceLoader: jest.fn(),
          prebuild: jest.fn(),
          build: jest.fn(),
          prepare: jest.fn()
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
          prepare: jest.fn()
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
      prepare: [plugins[0], plugins[1], plugins[2]]
    });
  });
});
