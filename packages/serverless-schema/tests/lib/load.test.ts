import { createTempDir, deleteDir, copyDirectory } from "@sodev/test-utils";
import { join, dirname } from "path";
import { load } from "../../src/lib/load";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import { mkdir, readFile, writeFile } from "fs/promises";

const getAjv = () => {
  const ajv = new Ajv({ strictTuples: false });
  addFormats(ajv);
  return ajv;
};

const installDefaultSchemaInTempDir = async (dir: string): Promise<void> => {
  await copyDirectory(
    join(__dirname, "../../meta-schemas"),
    join(dir, "node_modules/@somod/serverless-schema/meta-schemas")
  );
  await copyDirectory(
    join(__dirname, "../../schemas"),
    join(dir, "node_modules/@somod/serverless-schema/schemas")
  );
};

const installTestSchemaInTempDir = async (dir: string): Promise<void> => {
  await Promise.all(
    ["index.json", "ssm-parameter.json"].map(async file => {
      const testSchemaPath = "@somod/test-scope/schemas";
      const testSchema = await readFile(
        join(__dirname, "testData/load", testSchemaPath, file),
        {
          encoding: "utf8"
        }
      );
      const correctedTestSchema = testSchema.replace(/__/g, "");
      const targetPath = join(dir, "node_modules", testSchemaPath, file);
      const targetDir = dirname(targetPath);
      await mkdir(targetDir, { recursive: true });
      await writeFile(targetPath, correctedTestSchema);
    })
  );
};

describe("Test lib load", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("default schema", async () => {
    await installDefaultSchemaInTempDir(dir);

    const validate = await load(
      "https://json-schema.sodaru.com/@somod/serverless-schema/schemas/index.json",
      getAjv(),
      dir
    );
    expect(validate.errors).toBeNull();
  });

  test("test schema", async () => {
    await installDefaultSchemaInTempDir(dir);

    await installTestSchemaInTempDir(dir);

    const validate = await load(
      "https://json-schema.sodaru.com/@somod/test-scope/schemas/index.json",
      getAjv(),
      dir
    );
    expect(validate.errors).toBeNull();
  });
});
