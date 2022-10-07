import { childProcess } from "nodejs-cli-runner";
import {
  readJsonFileStore,
  updateJsonFileStore,
  saveJsonFileStore
} from "nodejs-file-utils";
import { join } from "path";

const packageJsonUpdate = async (dir: string) => {
  const packageJsonPath = join(dir, "package.json");
  const { name, version, description, ...rest } = await readJsonFileStore(
    packageJsonPath,
    true
  );

  delete rest.module;
  delete rest.typings;
  delete rest.files;
  delete rest.sideEffects;
  delete rest.main;
  delete rest["jsnext:main"];
  delete rest.type;
  delete rest.scripts;

  const packageJsonUpdated = {
    name,
    version,
    description,
    module: "build/lib/index.js",
    typings: "build/lib/index.d.ts",
    files: ["build"],
    sideEffects: false,
    somod: "0.0.0",
    scripts: {
      build: "npx somod build",
      deploy: "npx somod deploy",
      start: "npx somod start",
      pretest: "npm run build",
      test: "echo 'No Tests defined'"
    },
    ...rest
  };

  updateJsonFileStore(packageJsonPath, packageJsonUpdated);
  await saveJsonFileStore(packageJsonPath);
};

export const npmInit = async (
  dir: string,
  verbose: boolean,
  prompt: boolean
) => {
  const args = [];
  if (!prompt) {
    args.push("--yes");
  }
  await childProcess(
    dir,
    process.platform === "win32" ? "npm.cmd" : "npm",
    ["init", ...args],
    { show: prompt || verbose ? "on" : "error", return: "off" },
    { show: prompt || verbose ? "on" : "error", return: "off" }
  );

  await packageJsonUpdate(dir);
};
