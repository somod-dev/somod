import { createFiles, createTempDir, deleteDir } from "../../utils";
import { generateFunctionIndex } from "../../../src";
import { existsSync, readdirSync, readFileSync } from "fs";
import { join } from "path";

describe("Test Task generateFunctionIndex", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("no build dir", async () => {
    await expect(generateFunctionIndex(dir)).resolves.toBeUndefined();
    expect(existsSync(join(dir, "build"))).toBeFalsy();
  });

  test("no serverless dir", async () => {
    createFiles(dir, { "build/": "" });
    await expect(generateFunctionIndex(dir)).resolves.toBeUndefined();
    expect(readdirSync(join(dir, "build"))).toEqual([]);
  });

  test("no functions dir", async () => {
    createFiles(dir, { "build/serverless/": "" });
    await expect(generateFunctionIndex(dir)).resolves.toBeUndefined();
    expect(readdirSync(join(dir, "build/serverless"))).toEqual([]);
  });

  test("empty functions dir", async () => {
    createFiles(dir, { "build/serverless/functions/": "" });
    await expect(generateFunctionIndex(dir)).resolves.toBeUndefined();
    expect(readdirSync(join(dir, "build/serverless"))).toEqual(["functions"]);
  });

  const template = (
    description: string,
    paths: Record<string, string>,
    dTs: string,
    js: string
  ): void => {
    test(description, async () => {
      createFiles(dir, paths);

      await expect(generateFunctionIndex(dir)).resolves.toBeUndefined();
      expect(
        readFileSync(join(dir, "build", "serverless", "functionIndex.d.ts"), {
          encoding: "utf8"
        })
      ).toEqual(dTs);
      expect(
        readFileSync(join(dir, "build", "serverless", "functionIndex.js"), {
          encoding: "utf8"
        })
      ).toEqual(js);
    });
  };

  template(
    "one function",
    {
      "build/serverless/functions/a.js":
        'const var1 = "abcd"; export default var1;',
      "build/serverless/functions/a.d.ts":
        "declare const var1 : string; export default var1;"
    },
    'export { default as a } from "./functions/a";',
    'export { default as a } from "./functions/a";'
  );

  template(
    "two functions",
    {
      "build/serverless/functions/a.js":
        'const var1 = "abcd"; export default var1;',
      "build/serverless/functions/a.d.ts":
        "declare const var1 : string; export default var1;",
      "build/serverless/functions/B.js":
        'const var1 = "abcd"; export default var1;',
      "build/serverless/functions/B.d.ts":
        "declare const var1 : string; export default var1;"
    },
    'export { default as B } from "./functions/B";\nexport { default as a } from "./functions/a";',
    'export { default as B } from "./functions/B";\nexport { default as a } from "./functions/a";'
  );
});
