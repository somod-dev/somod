import { build as esbuild } from "esbuild";
import { join } from "path";
import { IContext } from "somod-types";
import { file_extensionJs, file_extensionTs, path_build } from "../constants";
import { read } from "../packageJson";

export const bundle = async (context: IContext, verbose = false) => {
  const dir = context.dir;
  const sourceFile = join(dir, file_extensionTs);
  const targetFile = join(dir, path_build, file_extensionJs);

  const packageJson = await read(dir);
  await esbuild({
    sourcemap: "inline",
    platform: "node",
    external: ["tslib"],
    minify: true,
    target: ["node14"],
    logLevel: verbose ? "verbose" : "silent",
    ...((packageJson.ExtensionBuildOptions as Record<string, unknown>) || {}),
    bundle: true,
    entryPoints: [sourceFile],
    outfile: targetFile
  });
};
