import { createTempDir, deleteDir, copyDirectory } from "@sodev/test-utils";
import { join, dirname } from "path";
import { buildSchemaDir } from "../../src/lib/build";
import { mkdir, readFile, writeFile } from "fs/promises";
import { AnySchemaObject } from "ajv";

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
        join(__dirname, "testData/build/input", testSchemaPath, file),
        {
          encoding: "utf8"
        }
      );
      const correctedTestSchema = testSchema.replace(/__/g, "");
      const targetPath = join(dir, "schemas", file);
      const targetDir = dirname(targetPath);
      await mkdir(targetDir, { recursive: true });
      await writeFile(targetPath, correctedTestSchema);
    })
  );
};

const readSchema = async (
  file: string,
  preProcess?: (content: string) => string
): Promise<AnySchemaObject> => {
  const content = await readFile(file, { encoding: "utf8" });
  const _content = preProcess ? preProcess(content) : content;
  const schema = JSON.parse(_content);
  return schema;
};

describe("Test lib build", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("test schema", async () => {
    await installDefaultSchemaInTempDir(dir);

    await installTestSchemaInTempDir(dir);

    const assertSchema = async (schema: string): Promise<void> => {
      const expected = await readSchema(
        join(
          __dirname,
          `testData/build/output/@somod/test-scope/schemas/${schema}`
        ),
        content => {
          return content.replace(/__/g, "");
        }
      );
      const actual = await readSchema(join(dir, `schemas/${schema}`));

      expect(actual).toEqual(expected);
    };

    await buildSchemaDir(join(dir, "schemas"));

    await assertSchema("index.json");
    await assertSchema("ssm-parameter.json");
  });
});
