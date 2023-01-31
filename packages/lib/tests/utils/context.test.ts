import {
  IExtensionHandler,
  IModuleHandler,
  INamespaceHandler,
  IServerlessTemplateHandler
} from "somod-types";
import { Context } from "../../src/utils/context";
import { ExtensionHandler } from "../../src/utils/extension/handler";
import { ModuleHandler } from "../../src/utils/module";
import { NamespaceHandler } from "../../src/utils/namespace";
import { ServerlessTemplateHandler } from "../../src/utils/serverless/serverlessTemplate/serverlessTemplate";
import { mockedFunction } from "../utils";

jest.mock("../../src/utils/module", () => ({
  __esModule: true,
  ModuleHandler: { getInstance: jest.fn() }
}));

jest.mock("../../src/utils/extension/handler", () => ({
  __esModule: true,
  ExtensionHandler: { getInstance: jest.fn() }
}));

jest.mock("../../src/utils/namespace", () => ({
  __esModule: true,
  NamespaceHandler: { getInstance: jest.fn() }
}));

jest.mock(
  "../../src/utils/serverless/serverlessTemplate/serverlessTemplate",
  () => ({
    __esModule: true,
    ServerlessTemplateHandler: { getInstance: jest.fn() }
  })
);

describe("test util ContextHandler", () => {
  beforeEach(() => {
    mockedFunction(ModuleHandler.getInstance).mockResolvedValue(
      {} as IModuleHandler
    );
    mockedFunction(ExtensionHandler.getInstance).mockResolvedValue(
      {} as IExtensionHandler
    );
    mockedFunction(NamespaceHandler.getInstance).mockResolvedValue(
      {} as INamespaceHandler
    );
    mockedFunction(ServerlessTemplateHandler.getInstance).mockResolvedValue(
      {} as IServerlessTemplateHandler
    );
  });

  afterEach(() => {
    Context["instance"] = undefined;
    mockedFunction(ModuleHandler.getInstance).mockReset();
    mockedFunction(ExtensionHandler.getInstance).mockReset();
    mockedFunction(NamespaceHandler.getInstance).mockReset();
    mockedFunction(ServerlessTemplateHandler.getInstance).mockReset();
  });
  test("test", async () => {
    const context = await Context.getInstance("/root/dir", true, false);
    expect(ModuleHandler.getInstance).toHaveBeenCalledTimes(1);
    expect(ExtensionHandler.getInstance).toHaveBeenCalledTimes(1);
    expect(NamespaceHandler.getInstance).toHaveBeenCalledTimes(1);
    expect(ServerlessTemplateHandler.getInstance).toHaveBeenCalledTimes(1);

    expect(context.dir).toEqual("/root/dir");
    expect(context.getModuleHash("@my-scoope/my-module")).toEqual("ab1e8d28");
    expect(context.isUI).toEqual(true);
    expect(context.isServerless).toEqual(false);
    expect(context.moduleHandler).toEqual({});
    expect(context.extensionHandler).toEqual({});
    expect(context.namespaceHandler).toEqual({});
    expect(context.serverlessTemplateHandler).toEqual({});
  });
});
