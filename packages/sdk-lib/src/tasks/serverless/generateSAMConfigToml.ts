import { existsSync } from "fs";
import { readFile, writeFile } from "fs/promises";
import { join } from "path";
import { file_samConfig, key_parameter_overrides } from "../../utils/constants";
import { generateSamConfigParameterOverrides } from "../../utils/serverless/parameter";

export const escapeQuotation = (str: string): string => {
  return str.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
};

export const generateSAMConfigToml = async (
  dir: string,
  moduleIndicators: string[]
) => {
  const parameterOverrides = await generateSamConfigParameterOverrides(
    dir,
    moduleIndicators
  );

  const samConfigTomlPath = join(dir, file_samConfig);

  const samConfig = existsSync(samConfigTomlPath)
    ? await readFile(samConfigTomlPath, { encoding: "utf8" })
    : "";

  const samConfigLines = samConfig.split("\n");

  let i = 0;
  for (; i < samConfigLines.length; i++) {
    if (samConfigLines[i].startsWith(key_parameter_overrides)) {
      break;
    }
  }
  if (i == samConfigLines.length && samConfigLines[i - 1].trim() == "") {
    // if last line is empty
    i = i - 1;
  }

  const parameterOverridesValue = Object.keys(parameterOverrides)
    .map(
      parameterSpace =>
        `${parameterSpace}="${escapeQuotation(
          parameterOverrides[parameterSpace]
        )}"`
    )
    .join(" ");

  samConfigLines[i] = `${key_parameter_overrides} = "${escapeQuotation(
    parameterOverridesValue
  )}"`;

  await writeFile(samConfigTomlPath, samConfigLines.join("\n"));
};
