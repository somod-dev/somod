import Ajv from "ajv";
import { loadSchemas } from "../src";
import addFormats from "ajv-formats";

describe("Test index.loadSchemas", () => {
  test("all schemas will load successfully", async () => {
    const ajv = new Ajv();
    addFormats(ajv);
    const validate = await loadSchemas(ajv);
    expect(validate.errors).toBeNull();
  });
});
