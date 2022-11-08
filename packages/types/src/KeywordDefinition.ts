import { IModuleHandler } from "./IModuleHandler";
import { IServerlessTemplateHandler } from "./IServerlessTemplateHandler";
import { JSONType, KeywordProcessor, KeywordValidator } from "./JsonTemplate";

export type GetValidator<KeywordType extends JSONType = JSONType> = (
  rootDir: string,
  currentModuleName: string,
  moduleHandler: IModuleHandler,
  serverlessTemplateHandler: IServerlessTemplateHandler
) => Promise<KeywordValidator<KeywordType>>;

export type GetProcessor<KeywordType extends JSONType = JSONType> = (
  rootDir: string,
  currentModuleName: string,
  moduleHandler: IModuleHandler,
  serverlessTemplateHandler: IServerlessTemplateHandler
) => Promise<KeywordProcessor<KeywordType>>;

export type KeywordDefinition<KeywordType extends JSONType = JSONType> = {
  keyword: string;
  getValidator: GetValidator<KeywordType>;
  getProcessor: GetProcessor<KeywordType>;
};
