import { JSONType, KeywordProcessor, KeywordValidator } from "./JsonTemplate";

export type ModuleTemplate<T = JSONType> = Readonly<{
  moduleName: string;
  location: string;
  path: string;
  json: T;
}>;

export type ModuleTemplateMap<T = JSONType> = Readonly<
  Record<string, ModuleTemplate<T>>
>;

export type GetValidator<
  KeywordType extends JSONType = JSONType,
  TemplateType extends JSONType = JSONType
> = (
  rootDir: string,
  currentModuleName: string,
  allModules: ModuleTemplateMap<TemplateType>
) => Promise<KeywordValidator<KeywordType>>;

export type GetProcessor<
  KeywordType extends JSONType = JSONType,
  TemplateType extends JSONType = JSONType
> = (
  rootDir: string,
  currentModuleName: string,
  allModules: ModuleTemplateMap<TemplateType>
) => Promise<KeywordProcessor<KeywordType>>;

export type KeywordDefinition<
  KeywordType extends JSONType = JSONType,
  TemplateType extends JSONType = JSONType
> = {
  keyword: string;
  getValidator: GetValidator<KeywordType, TemplateType>;
  getProcessor: GetProcessor<KeywordType, TemplateType>;
};
