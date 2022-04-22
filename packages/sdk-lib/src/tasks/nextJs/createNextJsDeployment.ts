import {
  createNjpDeploymentPackageJson,
  copyNextDeployment
} from "../../utils/nextJs";

export const createNextJsDeployment = async (dir: string): Promise<void> => {
  await createNjpDeploymentPackageJson(dir);
  await copyNextDeployment(dir);
};
