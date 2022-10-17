import { mockedFunction } from "../../utils";
import { loadLifeCycleHooks as loadLifeCycleHooksUtil } from "../../../src/utils/lifeCycle/load";
import { loadLifeCycleHooks } from "../../../src";

jest.mock("../../../src/utils/lifeCycle/load", () => {
  return {
    __esmodule: true,
    loadLifeCycleHooks: jest.fn()
  };
});

describe("Test task loadLifeCycleHooks", () => {
  beforeEach(() => {
    mockedFunction(loadLifeCycleHooksUtil).mockReset();
  });

  test("empty plugins", async () => {
    mockedFunction(loadLifeCycleHooksUtil).mockResolvedValue([]);
    await expect(loadLifeCycleHooks()).resolves.toEqual({
      namespaceLoaders: [],
      uiKeywords: [],
      serverlessKeywords: [],
      prebuild: [],
      build: [],
      preprepare: [],
      prepare: []
    });
  });

  test("single hook", async () => {
    const hooks: Awaited<ReturnType<typeof loadLifeCycleHooksUtil>> = [
      {
        name: "somod-plugin1",
        lifeCycle: {
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
    mockedFunction(loadLifeCycleHooksUtil).mockResolvedValue(hooks);
    await expect(loadLifeCycleHooks()).resolves.toEqual({
      namespaceLoaders: hooks.map(p => p.lifeCycle.namespaceLoader),
      uiKeywords: [hooks[0].lifeCycle.keywords.uiConfig[0]],
      serverlessKeywords: [hooks[0].lifeCycle.keywords.serverless[0]],
      prebuild: hooks,
      build: hooks,
      preprepare: hooks,
      prepare: hooks
    });
  });

  test("multiple hooks", async () => {
    const hooks: Awaited<ReturnType<typeof loadLifeCycleHooksUtil>> = [
      {
        name: "somod-plugin1",
        lifeCycle: {
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
        lifeCycle: {
          namespaceLoader: jest.fn(),
          prebuild: jest.fn(),
          build: jest.fn(),
          prepare: jest.fn()
        }
      },
      {
        name: "somod-plugin3",
        lifeCycle: {
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
    mockedFunction(loadLifeCycleHooksUtil).mockResolvedValue(hooks);
    await expect(loadLifeCycleHooks()).resolves.toEqual({
      namespaceLoaders: [hooks[1].lifeCycle.namespaceLoader],
      uiKeywords: [
        hooks[0].lifeCycle.keywords.uiConfig[0],
        hooks[2].lifeCycle.keywords.uiConfig[0]
      ],
      serverlessKeywords: [hooks[2].lifeCycle.keywords.serverless[0]],
      prebuild: [hooks[2], hooks[1], hooks[0]],
      build: [hooks[1], hooks[2]],
      preprepare: [hooks[2], hooks[0]],
      prepare: [hooks[0], hooks[1], hooks[2]]
    });
  });
});
