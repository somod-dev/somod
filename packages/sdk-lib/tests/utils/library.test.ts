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
    const libVersion = await copyCommonLib(dir, "njp");
    await expect(getToBeBundledLibraries(dir, "njp")).resolves.toEqual({
      "@somod/common-lib": "^" + libVersion,
      "@somod/njp-lib": libVersion,
      "@types/react": "^17.0.16",
      ajv: "^8.8.2",
      "ajv-formats": "^2.1.1",
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
    const libVersion = await copyCommonLib(dir, "slp");
    await expect(getToBeBundledLibraries(dir, "njp")).rejects.toMatchObject({
      message: expect.stringContaining(
        `ENOENT: no such file or directory, open '${join(
          dir,
          "node_modules/@somod/njp-lib/package.json"
        )}`
      )
    });
    await expect(getToBeBundledLibraries(dir, "slp")).resolves.toEqual({
      "@somod/common-lib": "^" + libVersion,
      "@somod/slp-lib": libVersion,
      ajv: "^8.8.2",
      "ajv-formats": "^2.1.1",
      "aws-sdk": "2.952.0",
      lodash: "^4.17.21",
      tslib: "^2.3.1",
      uuid: "^8.3.2"
    });
  });

  test("with common-lib, njp-lib and slp-lib", async () => {
    await copyCommonLib(dir, "common");
    await copyCommonLib(dir, "njp");
    const libVersion = await copyCommonLib(dir, "slp");
    await expect(getToBeBundledLibraries(dir, "njp")).resolves.toEqual({
      "@somod/common-lib": "^" + libVersion,
      "@somod/njp-lib": libVersion,
      "@types/react": "^17.0.16",
      ajv: "^8.8.2",
      "ajv-formats": "^2.1.1",
      lodash: "^4.17.21",
      next: "^12.0.7",
      react: "^17.0.2",
      "react-dom": "^17.0.2",
      tslib: "^2.3.1",
      uuid: "^8.3.2"
    });
    await expect(getToBeBundledLibraries(dir, "slp")).resolves.toEqual({
      "@somod/common-lib": "^" + libVersion,
      "@somod/slp-lib": libVersion,
      ajv: "^8.8.2",
      "ajv-formats": "^2.1.1",
      "aws-sdk": "2.952.0",
      lodash: "^4.17.21",
      tslib: "^2.3.1",
      uuid: "^8.3.2"
    });
  });
});
