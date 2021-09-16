import { unixStylePath } from "@sodaru-cli/base";
import { build, BuildResult } from "esbuild";
import { writeFile } from "fs/promises";
import { join, normalize } from "path";
import {
  file_packageJson,
  file_index_js,
  path_slpWorkingDir,
  path_lambdas
} from "./constants";

export const bundle = (
  outDir: string,
  file: string,
  sourceMap = false
): Promise<BuildResult> => {
  const outFile = join(outDir, file_index_js);

  return build({
    entryPoints: [file],
    bundle: true,
    outfile: outFile,
    sourcemap: sourceMap,
    platform: "node",
    external: ["aws-sdk"],
    minify: true,
    target: ["node14", "node12"]
  });
};

export const createPackageJson = async (
  module: string,
  functionName: string,
  outDir: string
): Promise<void> => {
  await writeFile(
    join(outDir, file_packageJson),
    JSON.stringify(
      {
        name: module + "-" + functionName,
        version: "1.0.0",
        description: `AWS Lambda function, auto created from ${functionName} function in ${module} module`
      },
      null,
      2
    )
  );
};

export const packageLambda = async (
  dir: string,
  file: string,
  sourceMap = false
): Promise<void> => {
  const _dir = unixStylePath(normalize(dir));
  const _file = unixStylePath(normalize(file));

  // relative file path will be of form /.slp/functions/<module>/<function>.js
  const relativeFilePath = _file.substring(_dir.length);

  const paths = relativeFilePath.split("/").slice(3);
  const functionFileName = paths.pop();
  const functionName = functionFileName.substring(
    0,
    functionFileName.lastIndexOf(".js")
  );
  const moduleName = paths.join("/");

  const outDir = join(
    dir,
    path_slpWorkingDir,
    path_lambdas,
    moduleName,
    functionName
  );

  await bundle(outDir, file, sourceMap);

  await createPackageJson(moduleName, functionName, outDir);
};
