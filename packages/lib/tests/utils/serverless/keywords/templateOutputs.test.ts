import { getParameterToModuleMap } from "../../../../src/utils/parameters/namespace";
import { keywordTemplateOutputs } from "../../../../src/utils/serverless/keywords/templateOutputs";
import { mockedFunction } from "../../../utils";
import { parseJson } from "../../../../src/utils/jsonTemplate";
import { IContext, JSONObjectNode, JSONType } from "somod-types";

jest.mock("../../../../src/utils/parameters/namespace", () => {
  return {
    __esModule: true,
    getParameterToModuleMap: jest.fn()
  };
});

type TemplateOutputsType = Record<string, JSONType>;

describe("Test templateOutputs keyword", () => {
  beforeEach(() => {
    mockedFunction(getParameterToModuleMap).mockReset();
    mockedFunction(getParameterToModuleMap).mockReturnValue({
      p1: "m1",
      "p1.1": "m1",
      p2: "m2"
    });
  });

  test("the getValidator calls getParameterToModuleMap", async () => {
    await keywordTemplateOutputs.getValidator("m1", {
      dir: "dir1"
    } as IContext);
    expect(getParameterToModuleMap).toHaveBeenCalledTimes(1);
    expect(getParameterToModuleMap).toHaveBeenNthCalledWith(1, {
      dir: "dir1"
    });
  });

  test("the validator with keyword at deep inside the template", async () => {
    const validator = await keywordTemplateOutputs.getValidator("m1", {
      dir: "dir1"
    } as IContext);

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
    const validator = await keywordTemplateOutputs.getValidator("m1", {
      dir: "dir1"
    } as IContext);

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
    const validator = await keywordTemplateOutputs.getValidator("m1", {
      dir: "dir1"
    } as IContext);

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
    const processor = await keywordTemplateOutputs.getProcessor("m1", {
      dir: "dir1",
      serverlessTemplateHandler: { getSAMOutputName: p => p }
    } as IContext);

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
    const processor = await keywordTemplateOutputs.getProcessor("m1", {
      dir: "dir1",
      serverlessTemplateHandler: { getSAMOutputName: p => p }
    } as IContext);

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
          p1: {
            Value: "a",
            Description: "Value for p1"
          },
          "p1.1": {
            Value: {
              x: "y"
            },
            Description: "Value for p1.1"
          }
        }
      }
    });
  });
});
