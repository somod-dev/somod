import { createFiles, createTempDir, deleteDir } from "../../utils";
import { setBuildInFilesInPackageJson } from "../../../src";
import { read } from "../../../src/utils/packageJson";

describe("Test Task setBuildInFilesInPackageJson", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for no prior files set", async () => {
    createFiles(dir, { "package.json": JSON.stringify({}) });
    await expect(setBuildInFilesInPackageJson(dir)).resolves.toBeUndefined();
    await expect(read(dir)).resolves.toEqual({ files: ["build"] });
  });

  test("for files = ['build']", async () => {
    createFiles(dir, { "package.json": JSON.stringify({ files: ["build"] }) });
    await expect(setBuildInFilesInPackageJson(dir)).resolves.toBeUndefined();
    await expect(read(dir)).resolves.toEqual({ files: ["build"] });
  });

  test("for files = ['bin']", async () => {
    createFiles(dir, { "package.json": JSON.stringify({ files: ["bin"] }) });
    await expect(setBuildInFilesInPackageJson(dir)).resolves.toBeUndefined();
    await expect(read(dir)).resolves.toEqual({ files: ["bin", "build"] });
  });
});
