import { getToBeBundledLibraries } from "../../src/utils/library";
import { createTempDir, deleteDir } from "../utils";

describe("Test Util library.getToBeBundledLibraries", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("with njp", async () => {
    await expect(getToBeBundledLibraries(dir, "njp")).resolves.toEqual({
      "@solib/json-validator": "^1.0.0",
      "@solib/common-types-schemas": "^1.0.0",
      "@solib/errors": "^1.0.0",
      lodash: "^4.17.21",
      next: "^12.0.7",
      react: "^17.0.2",
      "react-dom": "^17.0.2",
      tslib: "^2.3.1",
      uuid: "^8.3.2"
    });
  });

  test("with slp", async () => {
    await expect(getToBeBundledLibraries(dir, "slp")).resolves.toEqual({
      "@solib/json-validator": "^1.0.0",
      "@solib/common-types-schemas": "^1.0.0",
      "@solib/errors": "^1.0.0",
      "aws-sdk": "2.952.0",
      lodash: "^4.17.21",
      tslib: "^2.3.1",
      uuid: "^8.3.2"
    });
  });
});
