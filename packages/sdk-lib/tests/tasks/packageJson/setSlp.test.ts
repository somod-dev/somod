import { createFiles, createTempDir, deleteDir } from "../../utils";
import { setSlpInPackageJson } from "../../../src";
import { read } from "../../../src/utils/packageJson";

describe("Test Task setSlpInPackageJson", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  const slpVersionRegex = /^[0-9]+\.[0-9]+\.[0-9]+$/;

  test("for no prior slp set", async () => {
    createFiles(dir, { "package.json": JSON.stringify({}) });
    await expect(setSlpInPackageJson(dir)).resolves.toBeUndefined();
    await expect(read(dir)).resolves.toEqual({
      slp: expect.stringMatching(slpVersionRegex)
    });
  });

  test("for prior slp = '0.0.0'", async () => {
    createFiles(dir, { "package.json": JSON.stringify({ slp: "0.0.0" }) });
    await expect(setSlpInPackageJson(dir)).resolves.toBeUndefined();
    const result = await read(dir);
    expect(result).toEqual({
      slp: expect.stringMatching(slpVersionRegex)
    });
    expect(result.slp).not.toEqual("0.0.0");
  });
});
