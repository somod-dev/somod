import { JSONType, KeywordProcessor, KeywordValidator } from "../jsonTemplate";

export type ModuleContent<T = JSONType> = Readonly<{
  moduleName: string;
  location: string;
  path: string;
  json: T;
}>;

export type ModuleContentMap<T = JSONType> = Readonly<
  Record<string, ModuleContent<T>>
>;

export type GetValidator<
  T extends JSONType = JSONType,
  ContentType = JSONType
> = (
  rootDir: string,
  currentModuleName: string,
  allModules: ModuleContentMap<ContentType>
) => Promise<KeywordValidator<T>>;

export type GetProcessor<
  T extends JSONType = JSONType,
  ContentType = JSONType
> = (
  rootDir: string,
  currentModuleName: string,
  allModules: ModuleContentMap<ContentType>
) => Promise<KeywordProcessor<T>>;

export type KeywordDefinition<
  T extends JSONType = JSONType,
  ContentType = JSONType
> = {
  keyword: string;
  getValidator: GetValidator<T, ContentType>;
  getProcessor: GetProcessor<T, ContentType>;
};
