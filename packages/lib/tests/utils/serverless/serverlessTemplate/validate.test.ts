import { mockedFunction } from "../../../utils";
import {
  JSONTemplateError,
  parseJson,
  validateKeywords
} from "../../../../src/utils/jsonTemplate";
import { getBaseKeywords } from "../../../../src/utils/serverless/serverlessTemplate/serverlessTemplate";
import { validateServerlessTemplate } from "../../../../src/utils/serverless/serverlessTemplate/validate";
import ErrorSet from "../../../../src/utils/ErrorSet";
import { IContext } from "somod-types";

jest.mock(
  "../../../../src/utils/serverless/serverlessTemplate/serverlessTemplate",
  () => {
    const original = jest.requireActual(
      "../../../../src/utils/serverless/serverlessTemplate/serverlessTemplate"
    );
    return {
      __esModule: true,
      ...original,
      getBaseKeywords: jest.fn()
    };
  }
);

jest.mock("../../../../src/utils/jsonTemplate", () => {
  const original = jest.requireActual("../../../../src/utils/jsonTemplate");
  return { __esModule: true, ...original, validateKeywords: jest.fn() };
});

describe("test util serverlessTemplate.validate", () => {
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
      validateServerlessTemplate({
        extensionHandler: { serverlessTemplateKeywords: [] },
        moduleHandler: { rootModuleName: "m0" },
        serverlessTemplateHandler: {
          getTemplate: (() => {
            return {
              module: "m0",
              template: {
                Resources: {
                  R0: {
                    Type: "",
                    Properties: {}
                  }
                }
              }
            };
          }) as IContext["serverlessTemplateHandler"]["getTemplate"]
        }
      } as IContext)
    ).resolves.toBeUndefined();

    expect(getBaseKeywords).toHaveBeenCalledTimes(1);
    expect(validateKeywords).toHaveBeenCalledTimes(1);
    expect(validateKeywords).toHaveBeenNthCalledWith(
      1,
      parseJson({
        Resources: {
          R0: {
            Type: "",
            Properties: {}
          }
        }
      }),
      { k1: validator }
    );
  });

  test("with errors", async () => {
    const jsonNode = parseJson({
      Resources: {
        R0: {
          Type: "",
          Properties: {}
        }
      }
    });
    mockedFunction(validateKeywords).mockResolvedValue([
      new JSONTemplateError(
        jsonNode,
        new Error("There is an error in template")
      )
    ]);

    await expect(
      validateServerlessTemplate({
        extensionHandler: { serverlessTemplateKeywords: [] },
        moduleHandler: { rootModuleName: "m0" },
        serverlessTemplateHandler: {
          getTemplate: (() => {
            return {
              module: "m0",
              template: {
                Resources: {
                  R0: {
                    Type: "",
                    Properties: {}
                  }
                }
              }
            };
          }) as IContext["serverlessTemplateHandler"]["getTemplate"]
        }
      } as IContext)
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
