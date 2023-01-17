import { IContext } from "somod-types";
import { validatePageExports } from "../../../src";
import { createFiles, createTempDir, deleteDir } from "../../utils";

describe("Test task validatePageExports", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir("test-somod-lib");
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for no pages directory", async () => {
    createFiles(dir, { "ui/": "" });
    await expect(
      validatePageExports({ dir } as IContext)
    ).resolves.toBeUndefined();
  });

  test("for empty pages directory", async () => {
    createFiles(dir, { "ui/pages/": "" });
    await expect(
      validatePageExports({ dir } as IContext)
    ).resolves.toBeUndefined();
  });

  test("for invalid file", async () => {
    createFiles(dir, { "ui/pages/aaaa.tsx": "<h1>cfd</h1>" });
    await expect(
      validatePageExports({ dir } as IContext)
    ).rejects.toMatchObject({
      message: expect.stringContaining(
        "ui/pages/aaaa.tsx must have a default export"
      )
    });
  });

  test("for file having named exports", async () => {
    createFiles(dir, {
      "ui/pages/home.tsx":
        "export default function Home() {} export const getStaticPaths = () => {};"
    });
    await expect(
      validatePageExports({ dir } as IContext)
    ).rejects.toMatchObject({
      message: expect.stringContaining(
        "ui/pages/home.tsx must not contain named exports. All data-fetching methods must be defined under ui/pages-data"
      )
    });
  });

  test("for all valid pages", async () => {
    createFiles(dir, {
      "ui/pages/home.tsx": "export default function Home() {}",
      "ui/pages/about/me.tsx": "export default function AboutMe() {}"
    });

    await expect(
      validatePageExports({ dir } as IContext)
    ).resolves.toBeUndefined();
  });
});
