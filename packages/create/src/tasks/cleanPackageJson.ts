import { childProcess } from "nodejs-cli-runner";
import {
  readJsonFileStore,
  saveJsonFileStore,
  updateJsonFileStore
} from "nodejs-file-utils";
import { join } from "path";

const updateSomodProperties = (
  packageJson: Record<string, unknown>,
  somodVersion: string
) => {
  packageJson.module = "build/lib/index.js";
  packageJson.typings = "build/lib/index.d.ts";
  packageJson.files = ["build"];
  packageJson.sideEffects = false;
  packageJson.somod = somodVersion;

  delete packageJson.devDependencies["somod-template"];

  delete packageJson.main;
  delete packageJson["jsnext:main"];
  delete packageJson.type;
};

const updateScripts = (
  packageJson: Record<string, unknown>,
  serverless: boolean,
  ui: boolean,
  eslint: boolean,
  prettier: boolean
) => {
  const scripts: Record<string, string> = {};
  const prebuild = [];
  if (prettier) {
    scripts.prettier =
      "npx prettier --check --ignore-unknown --no-error-on-unmatched-pattern ./**/*";
    prebuild.push("npm run prettier");
  }
  if (eslint) {
    scripts.eslint = "npx eslint ./ --no-error-on-unmatched-pattern";
    prebuild.push("npm run eslint");
  }
  if (prebuild.length > 0) {
    scripts.prebuild = prebuild.join(" && ");
  }
  const somodType =
    serverless && !ui ? " --serverless" : !serverless && ui ? " --ui" : "";
  scripts.build = "npx somod build" + somodType;
  scripts.pretest = "npm run build";
  scripts.test = "echo 'No Tests'";
  scripts.prepack = "npm run test";
  if (ui) {
    scripts.start = "npx somod start";
  }
  if (serverless) {
    scripts.deploy = "npx somod deploy";
  }
  packageJson.scripts = scripts;
};

export const cleanPackageJson = async (
  dir: string,
  serverless: boolean,
  ui: boolean,
  eslint: boolean,
  prettier: boolean
) => {
  const packageJsonPath = join(dir, "package.json");
  const version = (await readJsonFileStore(join(dir, "package-lock.json")))
    .packages["node_modules/somod"].version;

  const packageJson = await readJsonFileStore(packageJsonPath);

  updateSomodProperties(packageJson, version);
  updateScripts(packageJson, serverless, ui, eslint, prettier);

  updateJsonFileStore(packageJsonPath, packageJson);
  await saveJsonFileStore(packageJsonPath);

  await childProcess(
    dir,
    process.platform === "win32" ? "npm.cmd" : "npm",
    ["install"],
    { show: "on", return: "off" },
    { show: "on", return: "off" }
  );
};
