import { childProcess } from "nodejs-cli-runner";

export const npmInstall = async (
  dir: string,
  version: string,
  templateVersion: string,
  serverless: boolean,
  ui: boolean,
  eslint: boolean,
  prettier: boolean
) => {
  const args: string[] = [
    "install",
    "somod@" + version,
    "somod-template@" + templateVersion
  ];
  if (serverless) {
    args.push(
      "@types/node",
      "@types/aws-lambda",
      "aws-sdk",
      "somod-middleware"
    );
  }
  if (ui) {
    args.push("@types/node", "@types/react", "react", "next", "react-dom");
  }
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
