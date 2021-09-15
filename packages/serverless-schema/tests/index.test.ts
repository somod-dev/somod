import Ajv from "ajv";
import { loadSchemas } from "../src";

describe("Test index.loadSchemas", () => {
  test("all schemas will load successfully", async () => {
    const ajv = new Ajv();
    const validate = await loadSchemas(ajv);
    expect(validate.errors).toBeNull();
  });
});
