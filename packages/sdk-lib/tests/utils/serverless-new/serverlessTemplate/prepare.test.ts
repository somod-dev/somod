import { mockedFunction } from "@sodev/test-utils";
import {
  constructJson,
  parseJson,
  processKeywords
} from "../../../../src/utils/jsonTemplate";
import { getKeywords } from "../../../../src/utils/serverless-new/serverlessTemplate/serverlessTemplate";
import { prepareSamTemplate } from "../../../../src/utils/serverless-new/serverlessTemplate/prepare";
import { attachBaseLayer } from "../../../../src/utils/serverless-new/serverlessTemplate/attachBaseLayer";
import { extendResources } from "../../../../src/utils/serverless-new/serverlessTemplate/extendResources";

jest.mock(
  "../../../../src/utils/serverless-new/serverlessTemplate/serverlessTemplate",
  () => {
    const original = jest.requireActual(
      "../../../../src/utils/serverless-new/serverlessTemplate/serverlessTemplate"
    );
    return { __esModule: true, ...original, getKeywords: jest.fn() };
  }
);

jest.mock("../../../../src/utils/jsonTemplate", () => {
  const original = jest.requireActual("../../../../src/utils/jsonTemplate");
  return { __esModule: true, ...original, processKeywords: jest.fn() };
});

jest.mock(
  "../../../../src/utils/serverless-new/serverlessTemplate/attachBaseLayer",
  () => {
    const original = jest.requireActual(
      "../../../../src/utils/serverless-new/serverlessTemplate/attachBaseLayer"
    );
    return { __esModule: true, ...original, attachBaseLayer: jest.fn() };
  }
);

jest.mock(
  "../../../../src/utils/serverless-new/serverlessTemplate/extendResources",
  () => {
    const original = jest.requireActual(
      "../../../../src/utils/serverless-new/serverlessTemplate/extendResources"
    );
    return { __esModule: true, ...original, extendResources: jest.fn() };
  }
);

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
    mockedFunction(getKeywords).mockReset();
    mockedFunction(getKeywords).mockReturnValue([
      {
        keyword: "k1",
        getValidator: async () => validator,
        getProcessor: async () => processor
      }
    ]);
    mockedFunction(processKeywords).mockReset();
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
      }
    };

    await expect(
      prepareSamTemplate(
        "/a",
        ["m0", "m1", "m2", "m3"],
        moduleServerlessTemplateMap
      )
    ).resolves.toEqual(expectedSamTemplate);

    expect(getKeywords).toHaveBeenCalledTimes(1);
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
