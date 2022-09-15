import { childProcess } from "nodejs-cli-runner";

export const dependenciesInit = async (
  dir: string,
  verbose: boolean,
  dependencies: {
    dep?: string[];
    dev?: string[];
    peer?: string[];
  }
) => {
  const saveMap = {
    dep: "--save",
    dev: "--save-dev",
    peer: "--save-peer"
  };
  const install = async (type: "dep" | "dev" | "peer") => {
    if (dependencies[type]?.length > 0) {
      await childProcess(
        dir,
        process.platform === "win32" ? "npm.cmd" : "npm",
        ["install", ...dependencies[type], saveMap[type]],
        { show: verbose ? "on" : "error", return: "off" },
        { show: verbose ? "on" : "error", return: "off" }
      );
    }
  };

  await install("dep");
  await install("dev");
  await install("peer");
};
