import { createFiles } from "nodejs-file-utils";

export const filesInit = async (dir: string, files: Record<string, string>) => {
  createFiles(dir, files);
};
