import {
  createFiles,
  createTempDir,
  deleteDir,
  mockedFunction
} from "../../utils";
import { validateServerlessTemplate as validateServerlessTemplateUtil } from "../../../src/utils/serverless/serverlessTemplate/validate";
import { validateServerlessTemplate } from "../../../src";
import { ModuleHandler } from "../../../src/utils/moduleHandler";
import { join } from "path";
import { existsSync } from "fs";
import { dump } from "js-yaml";

jest.mock("../../../src/utils/serverless/serverlessTemplate/validate", () => {
  return {
    __esModule: true,
    validateServerlessTemplate: jest.fn()
  };
});

describe("test Task prepareSAMTemplate", () => {
  let dir: string = null;

  beforeEach(async () => {
    dir = createTempDir("test-somod-lib");
    ModuleHandler.initialize(dir, []);
    mockedFunction(validateServerlessTemplateUtil).mockReset();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for no resources", async () => {
    createFiles(dir, {
      "package.json": JSON.stringify({
        name: "my-module",
        version: "1.0.0",
        somod: "1.0.0"
      }),
      "serverless/template.yaml": "Resources: {}"
    });
    await expect(validateServerlessTemplate(dir)).resolves.toBeUndefined();
    expect(validateServerlessTemplateUtil).toHaveBeenCalledTimes(1);
    expect(validateServerlessTemplateUtil).toHaveBeenCalledWith(
      dir,
      "my-module",
      {
        "my-module": {
          module: "my-module",
          packageLocation: join(dir),
          root: true,
          template: { Resources: {} }
        }
      },
      []
    );
    expect(existsSync(join(dir, "template.yaml"))).not.toBeTruthy();
  });

  test("for valid template.yaml", async () => {
    createFiles(dir, {
      "package.json": JSON.stringify({
        name: "my-module",
        version: "1.0.0",
        somod: "1.0.0"
      }),
      "serverless/template.yaml": dump({
        Resources: {
          R1: { Type: "T1", Properties: {} },
          R2: { Type: "T2", Properties: {} }
        }
      })
    });
    await expect(validateServerlessTemplate(dir)).resolves.toBeUndefined();
    expect(validateServerlessTemplateUtil).toHaveBeenCalledTimes(1);
    expect(validateServerlessTemplateUtil).toHaveBeenCalledWith(
      dir,
      "my-module",
      {
        "my-module": {
          module: "my-module",
          packageLocation: join(dir),
          root: true,
          template: {
            Resources: {
              R1: { Type: "T1", Properties: {} },
              R2: { Type: "T2", Properties: {} }
            }
          }
        }
      },
      []
    );
  });
});
