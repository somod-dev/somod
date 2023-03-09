import { IContext } from "./Context";
import { JSONType, KeywordProcessor, KeywordValidator } from "./JsonTemplate";

export type GetValidator<KeywordType extends JSONType = JSONType> = (
  rootModuleName: string,
  context: IContext
) => Promise<KeywordValidator<KeywordType>>;

export type GetProcessor<KeywordType extends JSONType = JSONType> = (
  roodModuleName: string,
  context: IContext
) => Promise<KeywordProcessor<KeywordType>>;

export type KeywordDefinition<KeywordType extends JSONType = JSONType> = {
  keyword: string;
  getValidator: GetValidator<KeywordType>;
  getProcessor: GetProcessor<KeywordType>;
};
