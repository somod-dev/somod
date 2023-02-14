/* istanbul ignore file */

import { readFile } from "fs/promises";
import { join } from "path";
import { file_parametersJson, file_samConfig } from "../../utils/constants";
import {
  CloudFormationClient,
  DescribeStacksCommand
} from "@aws-sdk/client-cloudformation";
import {
  readJsonFileStore,
  saveJsonFileStore,
  updateJsonFileStore
} from "nodejs-file-utils";
import { existsSync } from "fs";
import { logWarning } from "nodejs-cli-runner";
import { IContext } from "somod-types";

const getStackNameFromSamConfig = async (dir: string) => {
  const samConfig = await readFile(join(dir, file_samConfig), {
    encoding: "utf8"
  });

  for (const samConfigLine of samConfig.split("\n")) {
    if (samConfigLine.startsWith("stack_name")) {
      let stackName = samConfigLine.substring("stack_name".length).trim();
      if (stackName.startsWith("=")) {
        stackName = stackName.substring(1).trim();
      }
      if (stackName.startsWith('"') && stackName.endsWith('"')) {
        stackName = stackName.substring(1, stackName.length - 1);
      }

      return stackName;
    }
  }

  return "";
};

export const updateParametersFromSAM = async (
  context: IContext,
  stackName?: string
) => {
  const _stackName =
    stackName || (await getStackNameFromSamConfig(context.dir));

  const client = new CloudFormationClient({});
  const command = new DescribeStacksCommand({ StackName: _stackName });
  const result = await client.send(command);
  if (result.Stacks?.length != 1) {
    throw new Error(
      `${result.Stacks.length} number of stacks found for ${_stackName}`
    );
  }

  if (result.Stacks[0].Outputs?.length == 0) {
    logWarning("No output found");
  }

  const outputParameterValues: Record<string, string> = {};

  result.Stacks[0].Outputs?.forEach(output => {
    outputParameterValues[
      context.serverlessTemplateHandler.getParameterNameFromSAMOutputName(
        output.OutputKey
      )
    ] = output.OutputValue;
  });

  const parametersPath = join(context.dir, file_parametersJson);

  const parameterValues = existsSync(parametersPath)
    ? await readJsonFileStore(parametersPath)
    : {};

  updateJsonFileStore(parametersPath, {
    ...parameterValues,
    ...outputParameterValues
  });

  await saveJsonFileStore(parametersPath);
};
