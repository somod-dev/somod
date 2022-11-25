import { build as esbuild } from "esbuild";
import { existsSync } from "fs";
import { join } from "path";
import { file_lifeCycleJs, file_lifeCycleTs, path_build } from "../constants";
import { read } from "../packageJson";

export const bundle = async (dir: string, verbose = false) => {
  const sourceFile = join(dir, file_lifeCycleTs);
  const targetFile = join(dir, path_build, file_lifeCycleJs);

  if (existsSync(sourceFile)) {
    const packageJson = await read(dir);
    await esbuild({
      sourcemap: "inline",
      platform: "node",
      external: ["tslib"],
      minify: true,
      target: ["node14"],
      logLevel: verbose ? "verbose" : "silent",
      ...((packageJson.LifeCycleEsbuildOptions as Record<string, unknown>) ||
        {}),
      bundle: true,
      entryPoints: [sourceFile],
      outfile: targetFile
    });
  }
};
