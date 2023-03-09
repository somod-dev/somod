import { loadPublicAssetNamespaces } from "../../src/utils/nextJs/publicAssets";
import { loadPageNamespaces } from "../../src/utils/nextJs/pages";
import { loadConfigNamespaces } from "../../src/utils/nextJs/config";
import {
  loadApiRouteNamespaces,
  loadOutputNamespaces
} from "../../src/utils/serverless/namespace";
import { loadParameterNamespaces } from "../../src/utils/parameters/namespace";
import { mockedFunction } from "../utils";
import { NamespaceHandler } from "../../src/utils/namespace";
import { IContext, NamespaceLoader } from "somod-types";

jest.mock("../../src/utils/nextJs/publicAssets", () => ({
  __esModule: true,
  loadPublicAssetNamespaces: jest.fn()
}));

jest.mock("../../src/utils/nextJs/pages", () => ({
  __esModule: true,
  loadPageNamespaces: jest.fn()
}));

jest.mock("../../src/utils/nextJs/config", () => ({
  __esModule: true,
  loadConfigNamespaces: jest.fn()
}));

jest.mock("../../src/utils/serverless/namespace", () => ({
  __esModule: true,
  loadApiRouteNamespaces: jest.fn(),
  loadOutputNamespaces: jest.fn()
}));

jest.mock("../../src/utils/parameters/namespace", () => ({
  __esModule: true,
  loadParameterNamespaces: jest.fn()
}));

describe("Test util namespace handler", () => {
  afterEach(() => {
    NamespaceHandler["instance"] = undefined;
  });

  test("with no namespaces", async () => {
    mockedFunction(loadPublicAssetNamespaces).mockResolvedValue([]);
    mockedFunction(loadPageNamespaces).mockResolvedValue([]);
    mockedFunction(loadConfigNamespaces).mockResolvedValue([]);
    mockedFunction(loadApiRouteNamespaces).mockResolvedValue([]);
    mockedFunction(loadOutputNamespaces).mockResolvedValue([]);
    mockedFunction(loadParameterNamespaces).mockResolvedValue([]);

    const context = {
      extensionHandler: { namespaceLoaders: [] },
      moduleHandler: {
        list: [
          { module: { name: "m1" }, children: [] },
          { module: { name: "m2" }, children: [] }
        ]
      }
    } as IContext;

    const namespaceHandler = await NamespaceHandler.getInstance(context);

    expect(namespaceHandler.names).toEqual([]);

    [
      loadPublicAssetNamespaces,
      loadPageNamespaces,
      loadConfigNamespaces,
      loadApiRouteNamespaces,
      loadOutputNamespaces,
      loadParameterNamespaces
    ].forEach(loader => {
      expect(loader).toHaveBeenCalledTimes(2);
      expect(loader).toHaveBeenNthCalledWith(
        1,
        context.moduleHandler.list[0].module,
        context
      );
      expect(loader).toHaveBeenNthCalledWith(
        2,
        context.moduleHandler.list[1].module,
        context
      );
    });
  });

  test("with some namespaces", async () => {
    mockedFunction(loadPublicAssetNamespaces).mockResolvedValue([]);
    mockedFunction(loadPageNamespaces).mockImplementation(async module => {
      return module.name == "m1"
        ? [{ name: "UI Page", values: ["index", "home", "about/me"] }]
        : [];
    });
    mockedFunction(loadConfigNamespaces).mockResolvedValue([]);
    mockedFunction(loadApiRouteNamespaces).mockResolvedValue([]);
    mockedFunction(loadOutputNamespaces).mockResolvedValue([]);
    mockedFunction(loadParameterNamespaces).mockImplementation(async module => {
      const map = {
        m1: [
          { name: "Parameter", values: ["auth.endpoint", "auth.social.google"] }
        ],
        m2: [{ name: "Parameter", values: ["client.id"] }]
      };
      return map[module.name];
    });

    const namespaceHandler = await NamespaceHandler.getInstance({
      extensionHandler: { namespaceLoaders: [] },
      moduleHandler: {
        list: [
          { module: { name: "m1" }, children: [] },
          { module: { name: "m2" }, children: [] }
        ]
      }
    } as IContext);

    expect(namespaceHandler.names).toEqual(["UI Page", "Parameter"]);
    expect(namespaceHandler.get("UI Page")).toEqual([
      { module: "m1", name: "UI Page", value: "index" },
      { module: "m1", name: "UI Page", value: "home" },
      { module: "m1", name: "UI Page", value: "about/me" }
    ]);
    expect(namespaceHandler.get("Parameter")).toEqual([
      { module: "m1", name: "Parameter", value: "auth.endpoint" },
      { module: "m1", name: "Parameter", value: "auth.social.google" },
      { module: "m2", name: "Parameter", value: "client.id" }
    ]);
    expect(namespaceHandler.get("UI Config")).toEqual([]);
  });

  test("with namespaces from extensions", async () => {
    mockedFunction(loadPublicAssetNamespaces).mockResolvedValue([]);
    mockedFunction(loadPageNamespaces).mockImplementation(async module => {
      return module.name == "m1"
        ? [{ name: "UI Page", values: ["index", "home", "about/me"] }]
        : [];
    });
    mockedFunction(loadConfigNamespaces).mockResolvedValue([]);
    mockedFunction(loadApiRouteNamespaces).mockResolvedValue([]);
    mockedFunction(loadOutputNamespaces).mockResolvedValue([]);
    mockedFunction(loadParameterNamespaces).mockResolvedValue([]);

    const namespaceHandler = await NamespaceHandler.getInstance({
      extensionHandler: {
        namespaceLoaders: [
          {
            extension: "e1",
            value: (async module => {
              return module.name == "m2"
                ? [
                    {
                      name: "API",
                      values: [
                        "GET user/{id}",
                        "POST user/{id}",
                        "DELETE user/{id}"
                      ]
                    }
                  ]
                : [];
            }) as NamespaceLoader
          }
        ]
      },
      moduleHandler: {
        list: [
          { module: { name: "m1" }, children: [] },
          { module: { name: "m2" }, children: [] }
        ]
      }
    } as IContext);

    expect(namespaceHandler.names).toEqual(["UI Page", "API"]);
    expect(namespaceHandler.get("UI Page")).toEqual([
      { module: "m1", name: "UI Page", value: "index" },
      { module: "m1", name: "UI Page", value: "home" },
      { module: "m1", name: "UI Page", value: "about/me" }
    ]);
    expect(namespaceHandler.get("Parameter")).toEqual([]);
    expect(namespaceHandler.get("UI Config")).toEqual([]);
    expect(namespaceHandler.get("API")).toEqual([
      { module: "m2", name: "API", value: "GET user/{id}" },
      { module: "m2", name: "API", value: "POST user/{id}" },
      { module: "m2", name: "API", value: "DELETE user/{id}" }
    ]);
  });

  test("with unresolved namespaces", async () => {
    mockedFunction(loadPublicAssetNamespaces).mockResolvedValue([]);
    mockedFunction(loadPageNamespaces).mockImplementation(async module => {
      return module.name == "m1"
        ? [{ name: "UI Page", values: ["index", "home", "about/me"] }]
        : [];
    });
    mockedFunction(loadConfigNamespaces).mockResolvedValue([]);
    mockedFunction(loadApiRouteNamespaces).mockImplementation(async module => {
      const map = {
        m1: [{ name: "API", values: ["GET /login", "POST /register"] }],
        m2: [{ name: "API", values: ["GET /mfa", "POST /mfa/enable"] }],
        m3: [{ name: "API", values: ["GET /forgot-password"] }],
        m4: [{ name: "API", values: ["GET /mfa"] }]
      };
      return map[module.name];
    });
    mockedFunction(loadOutputNamespaces).mockResolvedValue([]);
    mockedFunction(loadParameterNamespaces).mockResolvedValue([]);

    const context = {
      extensionHandler: { namespaceLoaders: [] },
      moduleHandler: {
        list: [
          { module: { name: "m1" }, children: [] },
          { module: { name: "m2" }, children: [] },
          { module: { name: "m3" }, children: [] },
          { module: { name: "m4" }, children: [] }
        ]
      }
    } as IContext;
    context.moduleHandler.list[0].children.push(
      context.moduleHandler.list[1],
      context.moduleHandler.list[2]
    );
    context.moduleHandler.list[2].children.push(context.moduleHandler.list[3]);

    await expect(NamespaceHandler.getInstance(context)).rejects
      .toMatchInlineSnapshot(`
      [Error: Following namespaces are unresolved
      API
       - GET /mfa
         - m2
         - m4]
    `);
  });

  test("with resolved namespaces", async () => {
    mockedFunction(loadPublicAssetNamespaces).mockResolvedValue([]);
    mockedFunction(loadPageNamespaces).mockImplementation(async module => {
      return module.name == "m1"
        ? [{ name: "UI Page", values: ["index", "home", "about/me"] }]
        : [];
    });
    mockedFunction(loadConfigNamespaces).mockResolvedValue([]);
    mockedFunction(loadApiRouteNamespaces).mockImplementation(async module => {
      const map = {
        m1: [
          { name: "API", values: ["GET /login", "POST /register", "GET /mfa"] }
        ],
        m2: [{ name: "API", values: ["GET /mfa", "POST /mfa/enable"] }],
        m3: [{ name: "API", values: ["GET /forgot-password"] }],
        m4: [{ name: "API", values: ["GET /mfa"] }]
      };
      return map[module.name];
    });
    mockedFunction(loadOutputNamespaces).mockResolvedValue([]);
    mockedFunction(loadParameterNamespaces).mockResolvedValue([]);

    const context = {
      extensionHandler: { namespaceLoaders: [] },
      moduleHandler: {
        list: [
          { module: { name: "m1" }, children: [] },
          { module: { name: "m2" }, children: [] },
          { module: { name: "m3" }, children: [] },
          { module: { name: "m4" }, children: [] }
        ]
      }
    } as IContext;
    context.moduleHandler.list[0].children.push(
      context.moduleHandler.list[1],
      context.moduleHandler.list[2]
    );
    context.moduleHandler.list[2].children.push(context.moduleHandler.list[3]);

    const namespaceHandler = await NamespaceHandler.getInstance(context);
    expect(namespaceHandler.names).toEqual(["UI Page", "API"]);
    expect(namespaceHandler.get("UI Page")).toEqual([
      { module: "m1", name: "UI Page", value: "index" },
      { module: "m1", name: "UI Page", value: "home" },
      { module: "m1", name: "UI Page", value: "about/me" }
    ]);
    expect(namespaceHandler.get("API")).toEqual([
      { module: "m1", name: "API", value: "GET /login" },
      { module: "m1", name: "API", value: "POST /register" },
      { module: "m1", name: "API", value: "GET /mfa" },
      { module: "m2", name: "API", value: "POST /mfa/enable" },
      { module: "m3", name: "API", value: "GET /forgot-password" }
    ]);
    expect(namespaceHandler.get("UI Config")).toEqual([]);
  });
});
