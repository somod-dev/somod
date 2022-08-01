import { mockedFunction } from "@sodev/test-utils";
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
      init: [],
      namespace: [],
      prebuild: [],
      build: [],
      preprepare: [],
      prepare: [],
      tsconfig: { compilerOptions: {}, include: [] }
    });
  });

  test("single plugin", async () => {
    const plugins: Awaited<ReturnType<typeof loadPluginsUtil>> = [
      {
        name: "somod-plugin1",
        plugin: {
          init: jest.fn(),
          namespaceLoader: jest.fn(),
          prebuild: jest.fn(),
          build: jest.fn(),
          preprepare: jest.fn(),
          prepare: jest.fn(),
          tsconfig: {
            compilerOptions: {
              lib: ["DOM"]
            },
            include: ["widgets"]
          }
        }
      }
    ];
    mockedFunction(loadPluginsUtil).mockResolvedValue(plugins);
    await expect(loadPlugins("")).resolves.toEqual({
      init: plugins,
      namespace: plugins,
      prebuild: plugins,
      build: plugins,
      preprepare: plugins,
      prepare: plugins,
      tsconfig: plugins[0].plugin.tsconfig
    });
  });

  test("multiple plugins", async () => {
    const plugins: Awaited<ReturnType<typeof loadPluginsUtil>> = [
      {
        name: "somod-plugin1",
        plugin: {
          prebuild: jest.fn(),
          preprepare: jest.fn(),
          prepare: jest.fn(),
          tsconfig: {
            compilerOptions: {
              lib: ["DOM"]
            },
            include: ["widgets"]
          }
        }
      },
      {
        name: "somod-plugin2",
        plugin: {
          init: jest.fn(),
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
          init: jest.fn(),
          prebuild: jest.fn(),
          build: jest.fn(),
          preprepare: jest.fn(),
          prepare: jest.fn()
        }
      }
    ];
    mockedFunction(loadPluginsUtil).mockResolvedValue(plugins);
    await expect(loadPlugins("")).resolves.toEqual({
      init: [plugins[1], plugins[2]],
      namespace: [plugins[1]],
      prebuild: [plugins[2], plugins[1], plugins[0]],
      build: [plugins[1], plugins[2]],
      preprepare: [plugins[2], plugins[0]],
      prepare: [plugins[0], plugins[1], plugins[2]],
      tsconfig: {
        compilerOptions: {
          lib: ["DOM", "ESNext"]
        },
        include: ["widgets", "schemas"]
      }
    });
  });
});
