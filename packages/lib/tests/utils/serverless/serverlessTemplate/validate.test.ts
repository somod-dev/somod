import { mockedFunction } from "../../../utils";
import {
  JSONTemplateError,
  parseJson,
  validateKeywords
} from "../../../../src/utils/jsonTemplate";
import { getBaseKeywords } from "../../../../src/utils/serverless/serverlessTemplate/serverlessTemplate";
import { validateServerlessTemplate } from "../../../../src/utils/serverless/serverlessTemplate/validate";
import ErrorSet from "../../../../src/utils/ErrorSet";

jest.mock(
  "../../../../src/utils/serverless/serverlessTemplate/serverlessTemplate",
  () => {
    const original = jest.requireActual(
      "../../../../src/utils/serverless/serverlessTemplate/serverlessTemplate"
    );
    return { __esModule: true, ...original, getBaseKeywords: jest.fn() };
  }
);

jest.mock("../../../../src/utils/jsonTemplate", () => {
  const original = jest.requireActual("../../../../src/utils/jsonTemplate");
  return { __esModule: true, ...original, validateKeywords: jest.fn() };
});

describe("test util serverlessTemplate.validate", () => {
  const moduleServerlessTemplateMap = {
    m0: {
      module: "m0",
      packageLocation: "/a",
      root: true,
      template: {
        Resources: {
          R0: {
            Type: "",
            Properties: {}
          }
        }
      }
    },

    m2: {
      module: "m2",
      packageLocation: "/a/node_modules/m2",
      root: undefined,
      template: {
        Resources: {
          R2: {
            Type: "",
            Properties: {}
          }
        }
      }
    },

    m3: {
      module: "m3",
      packageLocation: "a/node_modules/m3",
      root: undefined,
      template: {
        Resources: {
          R3: {
            Type: "",
            Properties: {}
          }
        }
      }
    }
  };

  const validator = jest.fn();
  const processor = jest.fn();

  beforeEach(() => {
    mockedFunction(getBaseKeywords).mockReset();
    mockedFunction(getBaseKeywords).mockReturnValue([
      {
        keyword: "k1",
        getValidator: async () => validator,
        getProcessor: async () => processor
      }
    ]);
    mockedFunction(validateKeywords).mockReset();
  });

  test("without errors", async () => {
    mockedFunction(validateKeywords).mockResolvedValue([]);

    await expect(
      validateServerlessTemplate("/a", "m0", moduleServerlessTemplateMap)
    ).resolves.toBeUndefined();

    expect(getBaseKeywords).toHaveBeenCalledTimes(1);
    expect(validateKeywords).toHaveBeenCalledTimes(1);
    expect(validateKeywords).toHaveBeenNthCalledWith(
      1,
      parseJson(moduleServerlessTemplateMap.m0.template),
      { k1: validator }
    );
  });

  test("with errors", async () => {
    const jsonNode = parseJson(moduleServerlessTemplateMap.m0.template);
    mockedFunction(validateKeywords).mockResolvedValue([
      new JSONTemplateError(
        jsonNode,
        new Error("There is an error in template")
      )
    ]);

    await expect(
      validateServerlessTemplate("/a", "m0", moduleServerlessTemplateMap)
    ).rejects.toEqual(
      new ErrorSet([new Error("Error at  : There is an error in template")])
    );

    expect(getBaseKeywords).toHaveBeenCalledTimes(1);
    expect(validateKeywords).toHaveBeenCalledTimes(1);
    expect(validateKeywords).toHaveBeenNthCalledWith(1, jsonNode, {
      k1: validator
    });
  });
});
