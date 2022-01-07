import { readJsonFileStore } from "@sodaru/cli-base";
import { cloneDeep } from "lodash";
import { join } from "path";
import { baseModuleName } from "..";
import { file_packageJson, path_nodeModules } from "../../../constants";
import {
  KeywordSLPFunctionLayerLibraries,
  KeywordSLPOutput,
  KeywordSLPRef,
  KeywordSLPResourceName,
  SLPRef,
  SLPResource,
  SLPTemplate
} from "../../types";

export const customResourceLayerName = "customResourceLayer";
/**
 * package '@solib/cfn-lambda' is installed as a peer dependency of '@somod/common-lib'
 *   but is not bundled in baseLayer
 */
export const cfnCustomResourceLibraryName = "@solib/cfn-lambda";

export const getCustomResourceLayerSLPResource = async (
  dir: string
): Promise<SLPResource | false> => {
  const cfnLibraryPackageJsonPath = join(
    dir,
    path_nodeModules,
    cfnCustomResourceLibraryName,
    file_packageJson
  );
  let cfnLibraryPackageJson = null;
  try {
    cfnLibraryPackageJson = (await readJsonFileStore(
      cfnLibraryPackageJsonPath
    )) as {
      version: string;
    };
  } catch (e) {
    if (
      e.message ==
      `ENOENT: no such file or directory, open '${cfnLibraryPackageJsonPath}'`
    ) {
      return false;
    } else {
      throw e;
    }
  }

  return {
    Type: "AWS::Serverless::LayerVersion",
    Metadata: {
      BuildMethod: "nodejs14.x",
      BuildArchitecture: "arm64"
    },
    [KeywordSLPOutput]: { default: true, attributes: [] },
    Properties: {
      LayerName: { [KeywordSLPResourceName]: customResourceLayerName },
      Description: "Wrapper libraries to create CloudFormation Custom Resource",
      CompatibleArchitectures: ["arm64"],
      CompatibleRuntimes: ["nodejs14.x"],
      RetentionPolicy: "Delete",
      [KeywordSLPFunctionLayerLibraries]: {
        [cfnCustomResourceLibraryName]: cfnLibraryPackageJson.version
      }
    }
  } as SLPResource;
};

export const apply = (slpTemplate: SLPTemplate, resourceId: string) => {
  const layers = (slpTemplate.Resources[resourceId].Properties.Layers ||
    []) as SLPRef[];
  layers.unshift({
    [KeywordSLPRef]: {
      module: baseModuleName,
      resource: customResourceLayerName
    }
  });
  slpTemplate.Resources[resourceId].Properties.Layers = layers;
  slpTemplate.original.Resources[resourceId].Properties.Layers =
    cloneDeep(layers);
};
