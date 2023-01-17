import { readFile } from "fs/promises";
import { join, relative } from "path";
import { IContext } from "somod-types";
import { generateNextConfig } from "../../../src";
import { generateCombinedConfig } from "../../../src/utils/nextJs/config";
import {
  createTempDir,
  deleteDir,
  mockedFunction,
  unixStylePath
} from "../../utils";

jest.mock("../../../src/utils/nextJs/config", () => {
  return {
    __esModule: true,
    generateCombinedConfig: jest.fn()
  };
});

describe("test Task generateNextConfig", () => {
  let dir: string;

  beforeEach(() => {
    dir = createTempDir("test-somod-lib");
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("test", async () => {
    mockedFunction(generateCombinedConfig).mockResolvedValue({
      env: {
        MY_ENV1: null,
        MY_ENV2: 1,
        MY_ENV3: "this.is.string",
        MY_ENV4: true
      },
      imageDomains: ["sodaru.com", "this.is.string"],
      publicRuntimeConfig: {
        prc1: true,
        prc2: false,
        prc3: { m3: "p1" }
      },
      serverRuntimeConfig: {
        src1: ["m3p2"],
        src2: ["m3", "p3"],
        src3: "m3p4"
      }
    });

    await expect(
      generateNextConfig({
        dir
      } as IContext)
    ).resolves.toBeUndefined();

    await expect(
      readFile(join(dir, ".env"), { encoding: "utf8" })
    ).resolves.toEqual(
      `MY_ENV1=null
MY_ENV2=1
MY_ENV3="this.is.string"
MY_ENV4=true`
    );

    await expect(readFile(join(dir, "next.config.js"), { encoding: "utf8" }))
      .resolves.toEqual(`/* eslint-disable */

const config = {
  images: {
    domains: ["sodaru.com", "this.is.string"]
  },
  publicRuntimeConfig: {"prc1":true,"prc2":false,"prc3":{"m3":"p1"}},
  serverRuntimeConfig: {"src1":["m3p2"],"src2":["m3","p3"],"src3":"m3p4"}
};

const withNextConfigOverride = require("${unixStylePath(
      relative(
        dir,
        join(__dirname, "../../../src/tasks/scripts/withNextConfigOverride.js")
      )
    )}");

module.exports = withNextConfigOverride(__dirname, config);
`);
  });
});
