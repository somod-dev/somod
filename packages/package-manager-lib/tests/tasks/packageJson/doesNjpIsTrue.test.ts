import { createFiles, createTempDir, deleteDir } from "../../utils";
import { doesNjpIsTrueInPackageJson } from "../../../src";
import { join } from "path";

describe("Test Task doesNjpIsTrue in package.json", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });
  test("for non existing file", async () => {
    expect.assertions(1);
    await expect(doesNjpIsTrueInPackageJson(dir)).rejects.toMatchObject({
      message: expect.stringContaining(
        "no such file or directory, open '" + join(dir, "package.json") + "'"
      )
    });
  });

  test("for invalid json file", async () => {
    expect.assertions(1);
    createFiles(dir, { "package.json": "" });
    await expect(doesNjpIsTrueInPackageJson(dir)).rejects.toMatchObject({
      message: expect.stringContaining("Unexpected end of JSON input")
    });
  });

  test("for valid file", async () => {
    expect.assertions(1);
    createFiles(dir, { "package.json": JSON.stringify({ njp: true }) });
    await expect(doesNjpIsTrueInPackageJson(dir)).resolves.toBeUndefined();
  });

  test("for njp = false", async () => {
    expect.assertions(1);
    createFiles(dir, { "package.json": JSON.stringify({ njp: false }) });
    await expect(doesNjpIsTrueInPackageJson(dir)).rejects.toMatchObject({
      message: `njp must be true in ${dir}/package.json`
    });
  });
});
