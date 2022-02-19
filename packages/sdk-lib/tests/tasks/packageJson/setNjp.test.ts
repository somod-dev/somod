import { createFiles, createTempDir, deleteDir } from "../../utils";
import { setNjpInPackageJson } from "../../../src";
import { read } from "../../../src/utils/packageJson";

describe("Test Task setNjpInPackageJson", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  const njpVersionRegex = /^[0-9]+\.[0-9]+\.[0-9]+$/;

  test("for no prior njp set", async () => {
    createFiles(dir, { "package.json": JSON.stringify({}) });
    await expect(setNjpInPackageJson(dir)).resolves.toBeUndefined();
    await expect(read(dir)).resolves.toEqual({
      njp: expect.stringMatching(njpVersionRegex)
    });
  });

  test("for prior njp = '0.0.0'", async () => {
    createFiles(dir, { "package.json": JSON.stringify({ njp: "0.0.0" }) });
    await expect(setNjpInPackageJson(dir)).resolves.toBeUndefined();
    const result = await read(dir);
    expect(result).toEqual({
      njp: expect.stringMatching(njpVersionRegex)
    });
    expect(result.njp).not.toEqual("0.0.0");
  });
});
