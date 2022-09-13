export {
  createFiles,
  createTempDir,
  deleteDir,
  readFiles,
  unixStylePath
} from "nodejs-file-utils";

export const mockedFunction = <T extends (...args: unknown[]) => unknown>(
  f: T
): jest.MockedFunction<T> => {
  return f as jest.MockedFunction<T>;
};
