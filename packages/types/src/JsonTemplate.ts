export type JSONBaseNode = Readonly<{
  parent?: {
    key: number | string;
    node: JSONArrayNode | JSONObjectNode;
  };
}>;

export type JSONPrimitiveNode = Readonly<{
  type: "primitive";
  value: JSONPrimitiveType;
}> &
  JSONBaseNode;

export type JSONArrayNode = Readonly<{
  type: "array";
  items: JSONNode[];
}> &
  JSONBaseNode;

export type JSONObjectNode = Readonly<{
  type: "object";
  properties: Record<string, JSONNode>;
}> &
  JSONBaseNode;

export type JSONNode = JSONPrimitiveNode | JSONArrayNode | JSONObjectNode;

export type JSONPrimitiveType = string | boolean | number | null;

export type JSONArrayType = JSONType[];

export type JSONObjectType = {
  [property: string]: JSONType;
};

export type JSONType = JSONPrimitiveType | JSONArrayType | JSONObjectType;

export type KeywordValidator<T extends JSONType = JSONType> = (
  keyword: string,
  node: JSONObjectNode,
  value: T
) => Error[];

export type KeywordObjectReplacement = {
  type: "object";
  value: JSONType;
};

export type KeywordKeywordReplacement = {
  type: "keyword";
  value: JSONObjectType;
};

export type KeywordReplacement =
  | KeywordObjectReplacement
  | KeywordKeywordReplacement;

export type KeywordProcessor<T extends JSONType = JSONType> = (
  keyword: string,
  node: JSONObjectNode,
  value: T
) => KeywordReplacement;
