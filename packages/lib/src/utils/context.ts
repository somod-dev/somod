import { createHash } from "crypto";
import { normalize } from "path";
import {
  IContext,
  IExtensionHandler,
  IModuleHandler,
  INamespaceHandler,
  IServerlessTemplateHandler
} from "somod-types";
import { ExtensionHandler } from "./extension/handler";
import { ModuleHandler } from "./module";
import { NamespaceHandler } from "./namespace";
import { ServerlessTemplateHandler } from "./serverless/serverlessTemplate/serverlessTemplate";

export class Context implements IContext {
  private static instance: IContext;

  private _dir: string;
  private _isUI: boolean;
  private _isServerless: boolean;
  private _isDebugMode: boolean;
  private _moduleHandler: IModuleHandler;
  private _extensionHandler: IExtensionHandler;
  private _namespaceHandler: INamespaceHandler;
  private _serverlessTemplateHandler: IServerlessTemplateHandler;

  private constructor() {
    // do nothing
  }

  static async getInstance(
    dir: string,
    isUI: boolean,
    isServerless: boolean,
    isDebugMode: boolean
  ) {
    if (this.instance === undefined) {
      const context = new Context();
      context._dir = normalize(dir);
      context._isUI = isUI;
      context._isServerless = isServerless;
      context._isDebugMode = isDebugMode;

      context._moduleHandler = await ModuleHandler.getInstance(context._dir);

      context._serverlessTemplateHandler =
        await ServerlessTemplateHandler.getInstance(context);

      context._extensionHandler = await ExtensionHandler.getInstance(
        context._moduleHandler
      );
      context._namespaceHandler = await NamespaceHandler.getInstance(context);

      this.instance = context;
    }
    return this.instance;
  }

  get dir() {
    return this._dir;
  }
  get moduleHandler() {
    return this._moduleHandler;
  }
  get extensionHandler(): IExtensionHandler {
    return this._extensionHandler;
  }
  get namespaceHandler() {
    return this._namespaceHandler;
  }
  get serverlessTemplateHandler() {
    return this._serverlessTemplateHandler;
  }
  get isUI() {
    return this._isUI;
  }
  get isServerless() {
    return this._isServerless;
  }
  get isDebugMode() {
    return this._isDebugMode;
  }
  getModuleHash(moduleName: string) {
    return createHash("sha256")
      .update(moduleName)
      .digest("hex")
      .substring(0, 8);
  }
}
