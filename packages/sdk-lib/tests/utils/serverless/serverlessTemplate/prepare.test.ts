import { mockedFunction } from "@sodev/test-utils";
import {
  constructJson,
  parseJson,
  processKeywords
} from "../../../../src/utils/jsonTemplate";
import { getBaseKeywords } from "../../../../src/utils/serverless/serverlessTemplate/serverlessTemplate";
import { prepareSamTemplate } from "../../../../src/utils/serverless/serverlessTemplate/prepare";
import { attachBaseLayer } from "../../../../src/utils/serverless/serverlessTemplate/attachBaseLayer";
import { extendResources } from "../../../../src/utils/serverless/serverlessTemplate/extendResources";
import { listAllOutputs } from "../../../../src/utils/serverless/namespace";

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
  return { __esModule: true, ...original, processKeywords: jest.fn() };
});

jest.mock(
  "../../../../src/utils/serverless/serverlessTemplate/attachBaseLayer",
  () => {
    const original = jest.requireActual(
      "../../../../src/utils/serverless/serverlessTemplate/attachBaseLayer"
    );
    return { __esModule: true, ...original, attachBaseLayer: jest.fn() };
  }
);

jest.mock(
  "../../../../src/utils/serverless/serverlessTemplate/extendResources",
  () => {
    const original = jest.requireActual(
      "../../../../src/utils/serverless/serverlessTemplate/extendResources"
    );
    return { __esModule: true, ...original, extendResources: jest.fn() };
  }
);

jest.mock("../../../../src/utils/serverless/namespace", () => {
  const original = jest.requireActual(
    "../../../../src/utils/serverless/namespace"
  );
  return { __esModule: true, ...original, listAllOutputs: jest.fn() };
});

describe("test util serverlessTemplate.prepare", () => {
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
        },
        Outputs: {
          p1: {
            Ref: "R0"
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
        },
        Outputs: {
          p1: {
            Ref: "R2"
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
        },
        Outputs: {
          p1: {
            "Fn::GetAtt": ["R3", "Arn"]
          },
          p2: {
            Ref: "R3"
          },
          p3: {
            Ref: "AWS::AccountId"
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
    mockedFunction(processKeywords).mockReset();
    mockedFunction(listAllOutputs).mockReset();
    mockedFunction(listAllOutputs).mockResolvedValue({
      p1: "m0",
      p2: "m3",
      p3: "m3"
    });
  });

  test("without errors", async () => {
    mockedFunction(processKeywords).mockImplementation(node => {
      return constructJson(node);
    });

    const expectedSamTemplate = {
      Resources: {
        ...moduleServerlessTemplateMap.m3.template.Resources,
        ...moduleServerlessTemplateMap.m2.template.Resources,
        ...moduleServerlessTemplateMap.m0.template.Resources
      },
      Outputs: {
        ...moduleServerlessTemplateMap.m3.template.Outputs,
        ...moduleServerlessTemplateMap.m0.template.Outputs
      }
    };

    await expect(
      prepareSamTemplate(
        "/a",
        ["m0", "m1", "m2", "m3"],
        moduleServerlessTemplateMap
      )
    ).resolves.toEqual(expectedSamTemplate);

    expect(getBaseKeywords).toHaveBeenCalledTimes(1);
    expect(processKeywords).toHaveBeenCalledTimes(3);
    expect(processKeywords).toHaveBeenNthCalledWith(
      1,
      parseJson(moduleServerlessTemplateMap.m3.template),
      { k1: processor }
    );
    expect(processKeywords).toHaveBeenNthCalledWith(
      2,
      parseJson(moduleServerlessTemplateMap.m2.template),
      { k1: processor }
    );
    expect(processKeywords).toHaveBeenNthCalledWith(
      3,
      parseJson(moduleServerlessTemplateMap.m0.template),
      { k1: processor }
    );

    expect(attachBaseLayer).toHaveBeenCalledTimes(1);
    expect(attachBaseLayer).toHaveBeenNthCalledWith(1, expectedSamTemplate);

    expect(extendResources).toHaveBeenCalledTimes(1);
    expect(extendResources).toHaveBeenNthCalledWith(1, expectedSamTemplate);
  });
});
