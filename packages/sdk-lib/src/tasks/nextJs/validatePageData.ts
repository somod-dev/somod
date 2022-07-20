import { ErrorSet, listFiles } from "@solib/cli-base";
import { existsSync } from "fs";
import { difference } from "lodash";
import { join } from "path";
import { path_pages, path_pagesData, path_ui } from "../../utils/constants";
import { get as getExports } from "../../utils/exports";
import { addPageExtention } from "../../utils/nextJs/pages";

const doesPageExistsForPageData = (pagesDir: string, pageData: string) => {
  const pageDataPathWithoutExtention = pageData.substring(
    0,
    pageData.lastIndexOf(".")
  );

  try {
    addPageExtention(join(pagesDir, pageDataPathWithoutExtention));
  } catch (e) {
    if (e?.message?.startsWith("Could not find supported extention for")) {
      return [
        new Error(
          `${path_ui}/${path_pagesData}/${pageData} does not have corresponding page under ${path_ui}/${path_pages}`
        )
      ];
    } else {
      throw e;
    }
  }
  return [];
};

const nextJsDataFetchingMethods = [
  "getInitialProps",
  "getServerSideProps",
  "getStaticPaths",
  "getStaticProps"
];

export const validatePageData = async (dir: string): Promise<void> => {
  const errors: Error[] = [];
  const pagesDir = join(dir, path_ui, path_pages);
  const pagesDataDir = join(dir, path_ui, path_pagesData);
  if (existsSync(pagesDataDir)) {
    const pagesData = await listFiles(pagesDataDir, ".ts");

    pagesData.forEach(pageData => {
      errors.push(...doesPageExistsForPageData(pagesDir, pageData));

      const exports = getExports(join(pagesDataDir, pageData));
      if (exports.default) {
        errors.push(
          new Error(
            `${path_ui}/${path_pagesData}/${pageData} must not have a default export`
          )
        );
      }
      const extraExports = difference(exports.named, nextJsDataFetchingMethods);
      if (extraExports.length > 0) {
        errors.push(
          new Error(
            `${path_ui}/${path_pagesData}/${pageData} must contain only data fetching methods from nextJs.\n Refer https://nextjs.org/docs/api-reference/data-fetching/get-initial-props`
          )
        );
      }
    });
  }

  if (errors.length > 0) {
    throw new ErrorSet(errors);
  }
};
