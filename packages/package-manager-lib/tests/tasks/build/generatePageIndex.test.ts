import { createFiles, createTempDir, deleteDir } from "../../utils";
import { generatePageIndex } from "../../../src";
import { copyDirectory } from "../../../src/utils/fileUtils";
import { existsSync, readdirSync, readFileSync } from "fs";
import { join } from "path";

describe("Test Task generatePagesIndex", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("no build dir", async () => {
    await expect(generatePageIndex(dir)).resolves.toBeUndefined();
    expect(existsSync(join(dir, "build"))).toBeFalsy();
  });

  test("no ui dir", async () => {
    createFiles(dir, { "build/": "" });
    await expect(generatePageIndex(dir)).resolves.toBeUndefined();
    expect(readdirSync(join(dir, "build"))).toEqual([]);
  });

  test("no pages dir", async () => {
    createFiles(dir, { "build/ui/": "" });
    await expect(generatePageIndex(dir)).resolves.toBeUndefined();
    expect(readdirSync(join(dir, "build/ui"))).toEqual([]);
  });

  test("empty pages dir", async () => {
    createFiles(dir, { "build/ui/pages/": "" });
    await expect(generatePageIndex(dir)).resolves.toBeUndefined();
    expect(readdirSync(join(dir, "build/ui"))).toEqual(["pages"]);
  });

  test("with test data", async () => {
    createFiles(dir, { "build/ui/": "" });
    await copyDirectory(
      join(__dirname, "testData", "pages"),
      join(dir, "build", "ui", "pages")
    );
    await expect(generatePageIndex(dir)).resolves.toBeUndefined();

    expect(readdirSync(join(dir, "build", "ui"))).toEqual([
      "pageIndex.d.ts",
      "pageIndex.js",
      "pages",
      "pages.json"
    ]);

    expect(
      readFileSync(join(dir, "build", "ui", "pageIndex.d.ts"), {
        encoding: "utf8"
      })
    ).toEqual(
      readFileSync(join(__dirname, "testData", "expected", "pageIndex.d.ts"), {
        encoding: "utf8"
      })
    );

    expect(
      readFileSync(join(dir, "build", "ui", "pageIndex.js"), {
        encoding: "utf8"
      })
    ).toEqual(
      readFileSync(join(__dirname, "testData", "expected", "pageIndex.js"), {
        encoding: "utf8"
      })
    );

    expect(
      readFileSync(join(dir, "build", "ui", "pages.json"), { encoding: "utf8" })
    ).toEqual(
      readFileSync(join(__dirname, "testData", "expected", "pages.json"), {
        encoding: "utf8"
      })
    );
  });

  const template = (
    description: string,
    paths: Record<string, string>,
    dTs: string,
    js: string,
    pages: string
  ): void => {
    test(description, async () => {
      createFiles(dir, paths);

      await expect(generatePageIndex(dir)).resolves.toBeUndefined();
      expect(
        readFileSync(join(dir, "build", "ui", "pageIndex.d.ts"), {
          encoding: "utf8"
        })
      ).toEqual(dTs);
      expect(
        readFileSync(join(dir, "build", "ui", "pageIndex.js"), {
          encoding: "utf8"
        })
      ).toEqual(js);
      expect(
        readFileSync(join(dir, "build", "ui", "pages.json"), {
          encoding: "utf8"
        })
      ).toEqual(pages);
    });
  };

  template(
    "one page",
    {
      "build/ui/pages/a.js": 'export const var1 = "abcd";',
      "build/ui/pages/a.d.ts": "export declare const var1 : string;"
    },
    'export { var1 as Page1var1 } from "./pages/a";',
    'export { var1 as Page1var1 } from "./pages/a";',
    JSON.stringify(
      {
        a: {
          prefix: "Page1",
          exports: { default: false, named: ["var1"] }
        }
      },
      null,
      2
    )
  );
});
