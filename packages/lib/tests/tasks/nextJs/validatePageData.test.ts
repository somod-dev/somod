import { validatePageData } from "../../../src";
import ErrorSet from "../../../src/utils/ErrorSet";
import { createFiles, createTempDir, deleteDir } from "../../utils";

describe("Test task validatePageData", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir("test-somod-lib");
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for no pages-data directory", async () => {
    createFiles(dir, { "ui/": "" });
    await expect(validatePageData(dir)).resolves.toBeUndefined();
  });

  test("for empty pages-data directory", async () => {
    createFiles(dir, { "ui/pages-data/": "" });
    await expect(validatePageData(dir)).resolves.toBeUndefined();
  });

  test("for page-data without page", async () => {
    createFiles(dir, {
      "ui/pages-data/home.ts": "export const getStaticPaths = () => {};"
    });
    await expect(validatePageData(dir)).rejects.toEqual(
      new ErrorSet([
        new Error(
          `ui/pages-data/home.ts does not have corresponding page under ui/pages`
        )
      ])
    );
  });

  test("for page-data with default export", async () => {
    createFiles(dir, {
      "ui/pages/home.tsx": "export default function Home(){}",
      "ui/pages-data/home.ts": "export default function Home(){}"
    });
    await expect(validatePageData(dir)).rejects.toEqual(
      new ErrorSet([
        new Error(`ui/pages-data/home.ts must not have a default export`)
      ])
    );
  });

  test("for page-data with extra named exports", async () => {
    createFiles(dir, {
      "ui/pages/home.tsx": "export default function Home(){}",
      "ui/pages-data/home.ts":
        "export const getStaticPaths = () => {}; export const Home = () => {};"
    });
    await expect(validatePageData(dir)).rejects.toEqual(
      new ErrorSet([
        new Error(
          `ui/pages-data/home.ts must contain only data fetching methods from nextJs.\n Refer https://nextjs.org/docs/api-reference/data-fetching/get-initial-props`
        )
      ])
    );
  });

  test("for all Valid file", async () => {
    createFiles(dir, {
      "ui/pages/home.tsx": "export default function Home(){}",
      "ui/pages-data/home.ts": "export const getStaticPaths = () => {};"
    });
    await expect(validatePageData(dir)).resolves.toBeUndefined();
  });
});
