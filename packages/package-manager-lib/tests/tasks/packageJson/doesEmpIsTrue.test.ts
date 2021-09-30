import { createFiles, createTempDir, deleteDir } from "../../utils";
import { doesEmpIsTrueInPackageJson } from "../../../src";

describe("Test Task doesEmpIsTrueInPackageJson", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for no emp set", async () => {
    expect.assertions(1);
    createFiles(dir, { "package.json": JSON.stringify({}) });
    await expect(doesEmpIsTrueInPackageJson(dir)).rejects.toEqual(
      new Error(`emp must be true in ${dir}/package.json`)
    );
  });

  test("for emp = true", async () => {
    expect.assertions(1);
    createFiles(dir, { "package.json": JSON.stringify({ emp: true }) });
    await expect(doesEmpIsTrueInPackageJson(dir)).resolves.toBeUndefined();
  });

  test("for emp = false", async () => {
    expect.assertions(1);
    createFiles(dir, { "package.json": JSON.stringify({ emp: false }) });
    await expect(doesEmpIsTrueInPackageJson(dir)).rejects.toEqual(
      new Error(`emp must be true in ${dir}/package.json`)
    );
  });

  test('for emp = "true"', async () => {
    expect.assertions(1);
    createFiles(dir, { "package.json": JSON.stringify({ emp: "true" }) });
    await expect(doesEmpIsTrueInPackageJson(dir)).rejects.toEqual(
      new Error(`emp must be true in ${dir}/package.json`)
    );
  });
});
