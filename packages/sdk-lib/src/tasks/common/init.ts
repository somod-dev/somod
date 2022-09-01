import { logWarning, unixStylePath } from "@solib/cli-base";
import { existsSync } from "fs";
import { mkdir, writeFile } from "fs/promises";
import { get } from "https";
import { dirname, join, normalize, relative } from "path";
import {
  file_configYaml,
  file_parametersYaml,
  file_templateYaml,
  path_nodeModules,
  path_serverless,
  path_ui
} from "../../utils/constants";

const download = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const req = get(url, res => {
      if (res.statusCode == 200) {
        const chunks: string[] = [];
        res.on("data", chunk => {
          chunks.push(chunk);
        });
        res.on("end", () => {
          resolve(chunks.join(""));
        });
        res.on("error", e => {
          reject(e);
        });
      } else {
        reject(
          `Invalid Response ${res.statusCode}: ${res.statusMessage} (${url})`
        );
      }
    });
    req.on("error", e => reject(e));
  });
};

const yamlFileToSchemaMap = {
  [file_parametersYaml]: "parameters",
  [`${path_ui}/${file_configYaml}`]: "ui-config",
  [`${path_serverless}/${file_templateYaml}`]: "serverless"
};

const getSchemaLocation = (dir: string, file: string) => {
  const schemaPath = yamlFileToSchemaMap[file];
  let schemaModuleContainer = __dirname;
  while (
    !existsSync(join(schemaModuleContainer, path_nodeModules, "@somod/schema"))
  ) {
    const parentDir = dirname(schemaModuleContainer);
    if (parentDir == schemaModuleContainer) {
      throw new Error(`Unable to find @somod/schema`);
    }
    schemaModuleContainer = parentDir;
  }
  const yamlFile = normalize(join(dir, file));
  const relativeSchemaPath = unixStylePath(
    relative(
      dirname(yamlFile),
      join(
        schemaModuleContainer,
        path_nodeModules,
        "@somod/schema",
        schemaPath,
        "schemas/index.json"
      )
    )
  );

  return relativeSchemaPath;
};

const updateSchemaLocation = (dir: string, file: string, content: string) => {
  if (yamlFileToSchemaMap[file] !== undefined) {
    const schemaLocation = getSchemaLocation(dir, file);
    const contentLines = content.split("\n");
    contentLines[0] = `# yaml-language-server: $schema=${schemaLocation}`;
    return contentLines.join("\n");
  } else {
    return content;
  }
};

export const init = async (
  dir: string,
  ui: boolean,
  serverless: boolean,
  force = false
) => {
  const baseUrl = "https://v1.init-template.somod.sodaru.com/";
  const filesListStr = await download(baseUrl + "files.json");
  const filesList = JSON.parse(filesListStr) as {
    common: string[];
    ui: string[];
    serverless: string[];
  };

  const filesToDownload = filesList.common;
  if (ui) {
    filesToDownload.push(...filesList.ui);
  }
  if (serverless) {
    filesToDownload.push(...filesList.serverless);
  }

  await Promise.all(
    filesToDownload.map(async file => {
      const content = await download(baseUrl + file);
      const fileSavePath = join(dir, file);

      const saveFile = async () => {
        await mkdir(dirname(fileSavePath), { recursive: true });
        await writeFile(fileSavePath, updateSchemaLocation(dir, file, content));
      };

      if (existsSync(fileSavePath)) {
        logWarning(`${file} exists : ${force ? "REPLACED" : "SKIPPED"}`);
        if (force) {
          await saveFile();
        }
      } else {
        await saveFile();
      }
    })
  );
};
