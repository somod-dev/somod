import { childProcess } from "nodejs-cli-runner";

export const npmInstall = async (
  dir: string,
  version: string,
  templateVersion: string,
  eslint: boolean,
  prettier: boolean,
  ui: boolean
) => {
  const args: string[] = [
    "install",
    "somod@" + version,
    "somod-template@" + templateVersion
  ];
  if (eslint) {
    args.push("eslint-config-sodaru");
    if (ui) {
      args.push("eslint-config-next");
    }
  }
  if (prettier) {
    args.push("prettier-config-sodaru");
  }
  args.push("--save-dev");

  await childProcess(
    dir,
    process.platform === "win32" ? "npm.cmd" : "npm",
    args,
    { show: "on", return: "off" },
    { show: "on", return: "off" }
  );
};
