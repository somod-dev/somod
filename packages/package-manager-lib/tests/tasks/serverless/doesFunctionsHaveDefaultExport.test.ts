import { join } from "path";
import { doesServerlessFunctionsHaveDefaultExport } from "../../../src";
import { createFiles, createTempDir, deleteDir } from "../../utils";

describe("Test task doesServerlessFunctionsHaveDefaultExport", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for no functions directory", async () => {
    createFiles(dir, { "serverless/": "" });
    await expect(
      doesServerlessFunctionsHaveDefaultExport(dir)
    ).resolves.toBeUndefined();
  });

  test("for empty functions directory", async () => {
    createFiles(dir, { "serverless/functions/": "" });
    await expect(
      doesServerlessFunctionsHaveDefaultExport(dir)
    ).resolves.toBeUndefined();
  });

  test("for invalid file", async () => {
    createFiles(dir, { "serverless/functions/aaaa.html": "<h1>cfd</h1>" });
    await expect(
      doesServerlessFunctionsHaveDefaultExport(dir)
    ).rejects.toMatchObject({
      message: expect.stringContaining(
        join(dir, "serverless/functions/aaaa.html") +
          " must have a default export"
      )
    });
  });

  test("for directory in functions", async () => {
    createFiles(dir, {
      "serverless/functions/aaaa.html": "<h1>cfd</h1>",
      "serverless/functions/bbb/": ""
    });

    let errors: string[] = [];
    try {
      await doesServerlessFunctionsHaveDefaultExport(dir);
    } catch (e) {
      errors = e.message.split("\n");
    }
    expect(errors.length).toEqual(2);
    expect(
      errors.includes(
        join(dir, "serverless/functions/aaaa.html") +
          " must have a default export"
      )
    ).toBeTruthy();

    expect(
      errors.includes(
        join(dir, "serverless/functions/bbb") +
          " is not a File. serverless/functions must only contain files"
      )
    ).toBeTruthy();
  });

  test("for all valid files", async () => {
    createFiles(dir, {
      "serverless/functions/a.ts": "const a = ()=>{}; export default a;",
      "serverless/functions/b.ts": 'export { m as default } from "module";'
    });
    await expect(
      doesServerlessFunctionsHaveDefaultExport(dir)
    ).resolves.toBeUndefined();
  });
});
