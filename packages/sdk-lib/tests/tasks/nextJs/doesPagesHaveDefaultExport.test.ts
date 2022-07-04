import { join } from "path";
import { doesPagesHaveDefaultExport } from "../../../src";
import { createFiles, createTempDir, deleteDir } from "@sodev/test-utils";

describe("Test task doesPagesHaveDefaultExport", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for no pages directory", async () => {
    createFiles(dir, { "ui/": "" });
    await expect(doesPagesHaveDefaultExport(dir)).resolves.toBeUndefined();
  });

  test("for empty pages directory", async () => {
    createFiles(dir, { "ui/pages/": "" });
    await expect(doesPagesHaveDefaultExport(dir)).resolves.toBeUndefined();
  });

  test("for invalid file", async () => {
    createFiles(dir, { "ui/pages/aaaa.tsx": "<h1>cfd</h1>" });
    await expect(doesPagesHaveDefaultExport(dir)).rejects.toMatchObject({
      message: expect.stringContaining(
        join(dir, "ui/pages/aaaa.tsx") + " must have a default export"
      )
    });
  });

  test("for all valid pages", async () => {
    createFiles(dir, {
      "ui/pages/home.tsx": "export default function Home() {}",
      "ui/pages/about/me.tsx": "export default function AboutMe() {}"
    });

    await expect(doesPagesHaveDefaultExport(dir)).resolves.toBeUndefined();
  });
});
