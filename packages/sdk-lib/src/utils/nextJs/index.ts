import { copyDirectory, readJsonFileStore } from "@sodaru/cli-base";
import { existsSync } from "fs";
import { copyFile, mkdir, readdir, stat, writeFile } from "fs/promises";
import { join } from "path";
import {
  file_nextConfigJs,
  file_packageJson,
  file_packageLockJson,
  path_nextBuild,
  path_njp_deployment,
  path_njp_deployment_build,
  path_njp_working_dir,
  path_public
} from "../constants";

const getNjpDeploymentDir = (dir: string): string => {
  return join(dir, path_njp_working_dir, path_njp_deployment);
};

export const createNjpDeploymentPackageJson = async (dir: string) => {
  const njpDeploymentDir = getNjpDeploymentDir(dir);
  await mkdir(njpDeploymentDir, { recursive: true });

  const rootPackageLock = await readJsonFileStore(
    join(dir, file_packageLockJson)
  );

  await writeFile(
    join(njpDeploymentDir, file_packageJson),
    JSON.stringify(
      {
        name: rootPackageLock.name + "-deployment",
        version: rootPackageLock.version,
        scripts: {
          build: `mv ./${path_njp_deployment_build} ./${path_nextBuild}`
        },
        dependencies: {
          next: rootPackageLock.packages["node_modules/next"].version,
          react: rootPackageLock.packages["node_modules/react"].version,
          "react-dom":
            rootPackageLock.packages["node_modules/react-dom"].version
        }
      },
      null,
      2
    )
  );
};

export const copyNextDeployment = async (dir: string) => {
  const njpDeploymentDir = getNjpDeploymentDir(dir);
  const nextBuildContents = await readdir(join(dir, path_nextBuild));

  await mkdir(join(njpDeploymentDir, path_njp_deployment_build), {
    recursive: true
  });

  await Promise.all(
    nextBuildContents.map(async nextBuildContent => {
      if (nextBuildContent != "cache") {
        const sourcePath = join(dir, path_nextBuild, nextBuildContent);
        const targetPath = join(
          njpDeploymentDir,
          path_njp_deployment_build,
          nextBuildContent
        );
        const stats = await stat(sourcePath);
        if (stats.isDirectory()) {
          await copyDirectory(sourcePath, targetPath);
        } else {
          await copyFile(sourcePath, targetPath);
        }
      }
    })
  );
  if (existsSync(join(dir, file_nextConfigJs))) {
    await copyFile(
      join(dir, file_nextConfigJs),
      join(njpDeploymentDir, file_nextConfigJs)
    );
  }
  if (existsSync(join(dir, path_public))) {
    await copyDirectory(
      join(dir, path_public),
      join(njpDeploymentDir, path_public)
    );
  }
};
