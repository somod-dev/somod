import { join } from "path";
import { getToBeBundledLibraries } from "../../src/utils/library";
import { copyCommonLib, createTempDir, deleteDir } from "../utils";

describe("Test Util library.getToBeBundledLibraries", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("with only common-lib", async () => {
    await copyCommonLib(dir, "common");
    await expect(getToBeBundledLibraries(dir, "njp")).rejects.toMatchObject({
      message: expect.stringContaining(
        `ENOENT: no such file or directory, open '${join(
          dir,
          "node_modules/@somod/njp-lib/package.json"
        )}`
      )
    });
    await expect(getToBeBundledLibraries(dir, "slp")).rejects.toMatchObject({
      message: expect.stringContaining(
        `ENOENT: no such file or directory, open '${join(
          dir,
          "node_modules/@somod/slp-lib/package.json"
        )}`
      )
    });
  });

  test("with common-lib and njp-lib", async () => {
    await copyCommonLib(dir, "common");
    await copyCommonLib(dir, "njp");
    await expect(getToBeBundledLibraries(dir, "njp")).resolves.toEqual({
      "@solib/json-validator": "^0.0.2",
      lodash: "^4.17.21",
      next: "^12.0.7",
      react: "^17.0.2",
      "react-dom": "^17.0.2",
      tslib: "^2.3.1",
      uuid: "^8.3.2"
    });
    await expect(getToBeBundledLibraries(dir, "slp")).rejects.toMatchObject({
      message: expect.stringContaining(
        `ENOENT: no such file or directory, open '${join(
          dir,
          "node_modules/@somod/slp-lib/package.json"
        )}`
      )
    });
  });

  test("with common-lib and slp-lib", async () => {
    await copyCommonLib(dir, "common");
    await copyCommonLib(dir, "slp");
    await expect(getToBeBundledLibraries(dir, "njp")).rejects.toMatchObject({
      message: expect.stringContaining(
        `ENOENT: no such file or directory, open '${join(
          dir,
          "node_modules/@somod/njp-lib/package.json"
        )}`
      )
    });
    await expect(getToBeBundledLibraries(dir, "slp")).resolves.toEqual({
      "@solib/json-validator": "^0.0.2",
      "aws-sdk": "2.952.0",
      lodash: "^4.17.21",
      tslib: "^2.3.1",
      uuid: "^8.3.2"
    });
  });

  test("with common-lib, njp-lib and slp-lib", async () => {
    await copyCommonLib(dir, "common");
    await copyCommonLib(dir, "njp");
    await copyCommonLib(dir, "slp");
    await expect(getToBeBundledLibraries(dir, "njp")).resolves.toEqual({
      "@solib/json-validator": "^0.0.2",
      lodash: "^4.17.21",
      next: "^12.0.7",
      react: "^17.0.2",
      "react-dom": "^17.0.2",
      tslib: "^2.3.1",
      uuid: "^8.3.2"
    });
    await expect(getToBeBundledLibraries(dir, "slp")).resolves.toEqual({
      "@solib/json-validator": "^0.0.2",
      "aws-sdk": "2.952.0",
      lodash: "^4.17.21",
      tslib: "^2.3.1",
      uuid: "^8.3.2"
    });
  });
});
