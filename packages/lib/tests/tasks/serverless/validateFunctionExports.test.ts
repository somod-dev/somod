import { IContext } from "somod-types";
import { validateFunctionExports } from "../../../src";
import { createFiles, createTempDir, deleteDir } from "../../utils";

describe("Test task validateFunctionExports", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir("test-somod-lib");
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for no functions directory", async () => {
    createFiles(dir, { "serverless/": "" });
    await expect(
      validateFunctionExports({ dir } as IContext)
    ).resolves.toBeUndefined();
  });

  test("for empty functions directory", async () => {
    createFiles(dir, { "serverless/functions/": "" });
    await expect(
      validateFunctionExports({ dir } as IContext)
    ).resolves.toBeUndefined();
  });

  test("for invalid file", async () => {
    createFiles(dir, { "serverless/functions/aaaa.ts": "<h1>cfd</h1>" });
    await expect(
      validateFunctionExports({ dir } as IContext)
    ).rejects.toMatchObject({
      message: expect.stringContaining(
        "serverless/functions/aaaa.ts must have a default export"
      )
    });
  });

  test("for all valid functions", async () => {
    createFiles(dir, {
      "serverless/functions/home.ts":
        "export default function Home() {}; export const a = 10;",
      "serverless/functions/about/me.ts": "export default function AboutMe() {}"
    });

    await expect(
      validateFunctionExports({ dir } as IContext)
    ).resolves.toBeUndefined();
  });
});
