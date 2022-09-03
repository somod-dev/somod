import { cloneDeep } from "lodash";
import { attachBaseLayer } from "../../../../src/utils/serverless/serverlessTemplate/attachBaseLayer";
import { SAMTemplate } from "../../../../src/utils/serverless/types";
import { getPackageLocation } from "@somod/lambda-base-layer";
import { unixStylePath } from "@solib/cli-base";
import { join } from "path";

describe("Test util serverlessTemplate.attachBaseLayer", () => {
  test("without any functions", async () => {
    const samTemplate: SAMTemplate = {
      Resources: {
        R1: {
          Type: "T1",
          Properties: {}
        },
        R2: {
          Type: "T2",
          Properties: {}
        }
      }
    };

    const input = cloneDeep(samTemplate);

    await expect(attachBaseLayer(input)).resolves.toBeUndefined();

    expect(input).toEqual(samTemplate);
  });

  test("with functions", async () => {
    const samTemplate: SAMTemplate = {
      Resources: {
        R1: {
          Type: "AWS::Serverless::Function",
          Properties: {}
        },
        R2: {
          Type: "T2",
          Properties: {}
        },
        R3: {
          Type: "AWS::Serverless::Function",
          Properties: {
            Layers: [
              {
                Ref: "mylayer1"
              }
            ]
          }
        }
      }
    };

    const input = cloneDeep(samTemplate);

    await expect(attachBaseLayer(input)).resolves.toBeUndefined();

    expect(input).toEqual({
      Resources: {
        r7a97e042BaseLayer: {
          Properties: {
            ContentUri: unixStylePath(
              join(await getPackageLocation(), "layer")
            ),
            Description:
              "Set of npm libraries to be required in all Lambda funtions",
            RetentionPolicy: "Delete"
          },
          Type: "AWS::Serverless::LayerVersion"
        },
        R1: {
          Type: "AWS::Serverless::Function",
          Properties: {
            Layers: [
              {
                Ref: "r7a97e042BaseLayer"
              }
            ]
          }
        },
        R2: {
          Type: "T2",
          Properties: {}
        },
        R3: {
          Type: "AWS::Serverless::Function",
          Properties: {
            Layers: [
              {
                Ref: "r7a97e042BaseLayer"
              },
              {
                Ref: "mylayer1"
              }
            ]
          }
        }
      }
    });
  });
});
