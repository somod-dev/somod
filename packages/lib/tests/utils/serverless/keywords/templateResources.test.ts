import { keywordTemplateResources } from "../../../../src/utils/serverless/keywords/templateResources";
import { parseJson } from "../../../../src/utils/jsonTemplate";
import { IContext, JSONObjectNode, JSONType } from "somod-types";

type TemplateOutputsType = Record<string, JSONType>;

describe("Test templateOutputs keyword", () => {
  test("the validator with keyword at deep inside the template", async () => {
    const validator = await keywordTemplateResources.getValidator("m1", {
      dir: "dir1"
    } as IContext);

    const obj = {
      A: {
        [keywordTemplateResources.keyword]: "p1",
        additionalProp: "abcd"
      }
    };
    expect(
      validator(
        keywordTemplateResources.keyword,
        (parseJson(obj) as JSONObjectNode).properties["A"] as JSONObjectNode,
        obj.A[
          keywordTemplateResources.keyword
        ] as unknown as TemplateOutputsType
      )
    ).toEqual([]);
  });

  test("the validator with keyword at the top of the template", async () => {
    const validator = await keywordTemplateResources.getValidator("m1", {
      dir: "dir1"
    } as IContext);

    const obj = {
      [keywordTemplateResources.keyword]: {
        R1: { Type: "", Properties: {} },
        R2: { Type: "", Properties: {} }
      }
    };

    expect(
      validator(
        keywordTemplateResources.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordTemplateResources.keyword]
      )
    ).toEqual([]);
  });

  test("the processor for the keyword deep inside the template", async () => {
    const processor = await keywordTemplateResources.getProcessor("m1", {
      dir: "dir1",
      serverlessTemplateHandler: {
        getSAMResourceLogicalId: (m, r) => `${m}/${r}`
      }
    } as IContext);

    const obj = {
      A: {
        [keywordTemplateResources.keyword]: "p1",
        additionalProp: "abcd"
      }
    };

    expect(
      processor(
        keywordTemplateResources.keyword,
        (parseJson(obj) as JSONObjectNode).properties["A"] as JSONObjectNode,
        obj.A[
          keywordTemplateResources.keyword
        ] as unknown as TemplateOutputsType
      )
    ).toEqual({
      type: "keyword",
      value: {
        [keywordTemplateResources.keyword]:
          obj.A[keywordTemplateResources.keyword]
      }
    });
  });

  test("the processor with valid outputs", async () => {
    const processor = await keywordTemplateResources.getProcessor("m1", {
      dir: "dir1",
      serverlessTemplateHandler: {
        getSAMResourceLogicalId: (m, r) => `${m}/${r}`
      }
    } as IContext);

    const obj = {
      [keywordTemplateResources.keyword]: {
        R1: { Type: "T1", Properties: {} },
        R2: { Type: "T2", Properties: {} }
      }
    };

    expect(
      processor(
        keywordTemplateResources.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordTemplateResources.keyword]
      )
    ).toEqual({
      type: "keyword",
      value: {
        [keywordTemplateResources.keyword]: {
          "m1/R1": { Type: "T1", Properties: {} },
          "m1/R2": { Type: "T2", Properties: {} }
        }
      }
    });
  });
});
