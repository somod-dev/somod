import { mockedFunction } from "../../../utils";
import {
  constructJson,
  parseJson,
  processKeywords
} from "../../../../src/utils/jsonTemplate";
import { getBaseKeywords } from "../../../../src/utils/serverless/serverlessTemplate/serverlessTemplate";
import { prepareSamTemplate } from "../../../../src/utils/serverless/serverlessTemplate/prepare";
import { getOutputToModuleMap } from "../../../../src/utils/serverless/namespace";
import { IContext, ServerlessTemplate } from "somod-types";

const moduleTemplates = [
  {
    module: "m0",
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
    } as ServerlessTemplate
  },
  {
    module: "m2",
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
  {
    module: "m3",
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
];

jest.mock(
  "../../../../src/utils/serverless/serverlessTemplate/serverlessTemplate",
  () => {
    return {
      __esModule: true,
      getBaseKeywords: jest.fn()
    };
  }
);

jest.mock("../../../../src/utils/jsonTemplate", () => {
  const original = jest.requireActual("../../../../src/utils/jsonTemplate");
  return { __esModule: true, ...original, processKeywords: jest.fn() };
});

jest.mock("../../../../src/utils/serverless/namespace", () => {
  const original = jest.requireActual(
    "../../../../src/utils/serverless/namespace"
  );
  return { __esModule: true, ...original, getOutputToModuleMap: jest.fn() };
});

describe("test util serverlessTemplate.prepare", () => {
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
    mockedFunction(getOutputToModuleMap).mockReset();
    mockedFunction(getOutputToModuleMap).mockReturnValue({
      p1: "m0",
      p2: "m3",
      p3: "m3"
    });
  });

  test("without errors", async () => {
    mockedFunction(processKeywords).mockImplementation(async node => {
      const processedTemplate = constructJson(node);
      // process output keys
      Object.keys(processedTemplate?.["Outputs"] || {}).forEach(outputName => {
        processedTemplate["Outputs"]["sam-" + outputName] =
          processedTemplate["Outputs"][outputName];
        delete processedTemplate["Outputs"][outputName];
      });
      return processedTemplate;
    });

    const expectedSamTemplate = {
      Resources: {
        ...moduleTemplates[2].template.Resources,
        ...moduleTemplates[1].template.Resources,
        ...moduleTemplates[0].template.Resources
      },
      Outputs: {
        "sam-p1": {
          Ref: "R0"
        },
        "sam-p2": {
          Ref: "R3"
        },
        "sam-p3": {
          Ref: "AWS::AccountId"
        }
      }
    };

    await expect(
      prepareSamTemplate({
        dir: "/a",
        extensionHandler: { serverlessTemplateKeywords: [] },
        moduleHandler: {
          list: [
            { module: { name: "m0" } },
            { module: { name: "m1" } },
            { module: { name: "m2" } },
            { module: { name: "m3" } }
          ]
        },
        serverlessTemplateHandler: {
          getSAMOutputName: p => "sam-" + p,
          listTemplates: () => moduleTemplates,
          getResource: (module, resource) => ({
            resource: moduleTemplates.filter(mt => mt.module == module)[0]
              .template.Resources[resource]
          })
        }
      } as IContext)
    ).resolves.toEqual(expectedSamTemplate);

    expect(getBaseKeywords).toHaveBeenCalledTimes(1);
    expect(processKeywords).toHaveBeenCalledTimes(3);
    expect(processKeywords).toHaveBeenNthCalledWith(
      1,
      parseJson(moduleTemplates[2].template),
      { k1: processor }
    );
    expect(processKeywords).toHaveBeenNthCalledWith(
      2,
      parseJson(moduleTemplates[1].template),
      { k1: processor }
    );
    expect(processKeywords).toHaveBeenNthCalledWith(
      3,
      parseJson(moduleTemplates[0].template),
      { k1: processor }
    );
  });
});
