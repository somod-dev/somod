import { listAllParameters } from "../../../../src/utils/parameters/namespace";
import { keywordTemplateOutputs } from "../../../../src/utils/serverless/keywords/templateOutputs";
import { mockedFunction } from "@sodev/test-utils";
import { parseJson } from "../../../../src/utils/jsonTemplate";
import { JSONObjectNode, JSONType } from "somod-types";

jest.mock("../../../../src/utils/parameters/namespace", () => {
  return {
    __esModule: true,
    listAllParameters: jest.fn()
  };
});

type TemplateOutputsType = Record<string, JSONType>;

describe("Test templateOutputs keyword", () => {
  beforeEach(() => {
    mockedFunction(listAllParameters).mockReset();
    mockedFunction(listAllParameters).mockResolvedValue({
      p1: "m1",
      "p1.1": "m1",
      p2: "m2"
    });
  });

  test("the getValidator calls listAllParameters", async () => {
    await keywordTemplateOutputs.getValidator("dir1", "m1", {});
    expect(listAllParameters).toHaveBeenCalledTimes(1);
    expect(listAllParameters).toHaveBeenNthCalledWith(1);
  });

  test("the validator with keyword at deep inside the template", async () => {
    const validator = await keywordTemplateOutputs.getValidator(
      "dir1",
      "m1",
      {}
    );

    const obj = {
      A: {
        [keywordTemplateOutputs.keyword]: "p1",
        additionalProp: "abcd"
      }
    };
    expect(
      validator(
        keywordTemplateOutputs.keyword,
        (parseJson(obj) as JSONObjectNode).properties["A"] as JSONObjectNode,
        obj.A[keywordTemplateOutputs.keyword] as unknown as TemplateOutputsType
      )
    ).toEqual([]);
  });

  test("the validator with keyword at the top of the template", async () => {
    const validator = await keywordTemplateOutputs.getValidator(
      "dir1",
      "m1",
      {}
    );

    const obj = {
      [keywordTemplateOutputs.keyword]: { p1: "a", "p1.1": { x: "y" } }
    };

    expect(
      validator(
        keywordTemplateOutputs.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordTemplateOutputs.keyword]
      )
    ).toEqual([]);
  });

  test("the validator with missing parameter", async () => {
    const validator = await keywordTemplateOutputs.getValidator(
      "dir1",
      "m1",
      {}
    );

    const obj = {
      [keywordTemplateOutputs.keyword]: { p3: "waw", p2: "waw" }
    };

    expect(
      validator(
        keywordTemplateOutputs.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordTemplateOutputs.keyword]
      )
    ).toEqual([
      new Error(
        "parameter p3 referenced by Outputs does not exist. Define p3 in /parameters.yaml"
      )
    ]);
  });

  test("the processor for the keyword deep inside the template", async () => {
    const processor = await keywordTemplateOutputs.getProcessor(
      "dir1",
      "m1",
      {}
    );

    const obj = {
      A: {
        [keywordTemplateOutputs.keyword]: "p1",
        additionalProp: "abcd"
      }
    };

    expect(
      processor(
        keywordTemplateOutputs.keyword,
        (parseJson(obj) as JSONObjectNode).properties["A"] as JSONObjectNode,
        obj.A[keywordTemplateOutputs.keyword] as unknown as TemplateOutputsType
      )
    ).toEqual({
      type: "keyword",
      value: {
        [keywordTemplateOutputs.keyword]: obj.A[keywordTemplateOutputs.keyword]
      }
    });
  });

  test("the processor with valid outputs", async () => {
    const processor = await keywordTemplateOutputs.getProcessor(
      "dir1",
      "m1",
      {}
    );

    const obj = {
      [keywordTemplateOutputs.keyword]: { p1: "a", "p1.1": { x: "y" } }
    };

    expect(
      processor(
        keywordTemplateOutputs.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordTemplateOutputs.keyword]
      )
    ).toEqual({
      type: "keyword",
      value: {
        [keywordTemplateOutputs.keyword]: {
          o7031: {
            Value: "a"
          },
          o70312e31: {
            Value: {
              x: "y"
            }
          }
        }
      }
    });
  });
});
