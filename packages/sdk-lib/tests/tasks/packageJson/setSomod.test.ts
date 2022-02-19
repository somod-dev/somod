import { createFiles, createTempDir, deleteDir } from "../../utils";
import { setSomodInPackageJson } from "../../../src";
import { read } from "../../../src/utils/packageJson";

describe("Test Task setSomodInPackageJson", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  const somodVersionRegex = /^[0-9]+\.[0-9]+\.[0-9]+$/;

  test("for no prior somod set", async () => {
    createFiles(dir, { "package.json": JSON.stringify({}) });
    await expect(setSomodInPackageJson(dir)).resolves.toBeUndefined();
    await expect(read(dir)).resolves.toEqual({
      somod: expect.stringMatching(somodVersionRegex)
    });
  });

  test("for prior somod = '0.0.0'", async () => {
    createFiles(dir, { "package.json": JSON.stringify({ somod: "0.0.0" }) });
    await expect(setSomodInPackageJson(dir)).resolves.toBeUndefined();
    const result = await read(dir);
    expect(result).toEqual({
      somod: expect.stringMatching(somodVersionRegex)
    });
    expect(result.somod).not.toEqual("0.0.0");
  });
});
