import { JSONSchema7 } from "json-schema";
import {
  AccessDeniedError,
  DataValidationError,
  DuplicateResourceError,
  ResourceNotFoundError,
  SomodError
} from "../src/errors";
import { getValidator } from "../src/json-validator";

describe("Test errors types", () => {
  test("test somod error", () => {
    class ChildSomodError extends SomodError {
      private _privateInfo: string;
      constructor(message: string, module?: string) {
        super("ChildSomodError", message, module);
        this._privateInfo = "this-is-private-value";
        Object.setPrototypeOf(this, new.target.prototype);
      }

      get privateInfo() {
        return this._privateInfo;
      }
    }

    // simple
    const somodError = new ChildSomodError("something failed");
    expect(somodError).toBeInstanceOf(SomodError);
    expect(somodError.message).toEqual("ChildSomodError<>: something failed");
    expect(somodError.module).toEqual("");

    // with module
    const somodErrorWithModule = new ChildSomodError(
      "something failed",
      "my-module"
    );
    expect(somodError).toBeInstanceOf(SomodError);
    expect(somodErrorWithModule.message).toEqual(
      "ChildSomodError<my-module>: something failed"
    );
    expect(somodErrorWithModule.module).toEqual("my-module");

    expect(somodErrorWithModule.toObject()).toEqual({
      code: "ChildSomodError",
      message: "something failed",
      module: "my-module",
      privateInfo: "this-is-private-value"
    });
  });

  test("test resource not found error", () => {
    // simple
    const resourceNotFoundError = new ResourceNotFoundError(
      "my-resource",
      "my-resource-id"
    );
    expect(resourceNotFoundError).toBeInstanceOf(SomodError);
    expect(resourceNotFoundError).toBeInstanceOf(ResourceNotFoundError);

    expect(resourceNotFoundError.message).toEqual(
      "ResourceNotFoundError<>: my-resource with id = 'my-resource-id' not found"
    );
    expect(resourceNotFoundError.module).toEqual("");
    expect(resourceNotFoundError.resourceType).toEqual("my-resource");
    expect(resourceNotFoundError.identifier).toEqual("my-resource-id");

    // with module
    const resourceNotFoundErrorWithModule = new ResourceNotFoundError(
      "my-resource",
      "my-resource-id",
      "my-module"
    );
    expect(resourceNotFoundErrorWithModule.message).toEqual(
      "ResourceNotFoundError<my-module>: my-resource with id = 'my-resource-id' not found"
    );
    expect(resourceNotFoundErrorWithModule.module).toEqual("my-module");
    expect(resourceNotFoundErrorWithModule.resourceType).toEqual("my-resource");
    expect(resourceNotFoundErrorWithModule.identifier).toEqual(
      "my-resource-id"
    );

    // with object identifier
    const resourceNotFoundErrorWithObjectIdentifier = new ResourceNotFoundError(
      "my-resource",
      { type: "my-resource-type", name: "my-resource-name" }
    );
    expect(resourceNotFoundErrorWithObjectIdentifier.message).toEqual(
      "ResourceNotFoundError<>: my-resource with type = 'my-resource-type', name = 'my-resource-name' not found"
    );
    expect(resourceNotFoundErrorWithObjectIdentifier.module).toEqual("");
    expect(resourceNotFoundErrorWithObjectIdentifier.resourceType).toEqual(
      "my-resource"
    );
    expect(resourceNotFoundErrorWithObjectIdentifier.identifier).toEqual({
      type: "my-resource-type",
      name: "my-resource-name"
    });
    expect(resourceNotFoundErrorWithObjectIdentifier.toObject()).toEqual({
      code: "ResourceNotFoundError",
      message:
        "my-resource with type = 'my-resource-type', name = 'my-resource-name' not found",
      module: "",
      resourceType: "my-resource",
      identifier: { type: "my-resource-type", name: "my-resource-name" }
    });
  });

  test("test duplicate resource error", () => {
    // simple
    const duplicateResourceError = new DuplicateResourceError(
      "my-resource",
      "my-resource-id"
    );
    expect(duplicateResourceError).toBeInstanceOf(SomodError);
    expect(duplicateResourceError).toBeInstanceOf(DuplicateResourceError);
    expect(duplicateResourceError.message).toEqual(
      "DuplicateResourceError<>: my-resource with id = 'my-resource-id' exists"
    );
    expect(duplicateResourceError.module).toEqual("");
    expect(duplicateResourceError.resourceType).toEqual("my-resource");
    expect(duplicateResourceError.identifier).toEqual("my-resource-id");

    // with module
    const duplicateResourceErrorWithModule = new DuplicateResourceError(
      "my-resource",
      "my-resource-id",
      "my-module"
    );
    expect(duplicateResourceErrorWithModule.message).toEqual(
      "DuplicateResourceError<my-module>: my-resource with id = 'my-resource-id' exists"
    );
    expect(duplicateResourceErrorWithModule.module).toEqual("my-module");
    expect(duplicateResourceErrorWithModule.resourceType).toEqual(
      "my-resource"
    );
    expect(duplicateResourceErrorWithModule.identifier).toEqual(
      "my-resource-id"
    );

    // with object identifier
    const duplicateResourceErrorWithObjectIdentifier =
      new DuplicateResourceError("my-resource", {
        type: "my-resource-type",
        name: "my-resource-name"
      });
    expect(duplicateResourceErrorWithObjectIdentifier.message).toEqual(
      "DuplicateResourceError<>: my-resource with type = 'my-resource-type', name = 'my-resource-name' exists"
    );
    expect(duplicateResourceErrorWithObjectIdentifier.module).toEqual("");
    expect(duplicateResourceErrorWithObjectIdentifier.resourceType).toEqual(
      "my-resource"
    );
    expect(duplicateResourceErrorWithObjectIdentifier.identifier).toEqual({
      type: "my-resource-type",
      name: "my-resource-name"
    });
    expect(duplicateResourceErrorWithObjectIdentifier.toObject()).toEqual({
      code: "DuplicateResourceError",
      message:
        "my-resource with type = 'my-resource-type', name = 'my-resource-name' exists",
      module: "",
      resourceType: "my-resource",
      identifier: { type: "my-resource-type", name: "my-resource-name" }
    });
  });

  test("test data validation error", () => {
    const schema: JSONSchema7 = {
      type: "object",
      properties: {
        a: {
          oneOf: [
            {
              type: "object",
              properties: {
                type: { const: "type1" },
                name: { type: "string" }
              }
            },
            {
              type: "object",
              properties: {
                type: { const: "type2" },
                label: { type: "string" }
              }
            },
            {
              type: "string"
            }
          ]
        }
      }
    };

    const data = { a: { type: "mykey" } };

    const validator = getValidator(schema);
    validator(data);

    // simple
    const dataValidationError = new DataValidationError(
      schema,
      data,
      validator.errors
    );
    expect(dataValidationError).toBeInstanceOf(SomodError);
    expect(dataValidationError).toBeInstanceOf(DataValidationError);
    expect(dataValidationError.message).toEqual(
      "DataValidationError<>: 'type' property must be equal to the allowed value"
    );
    expect(dataValidationError.module).toEqual("");
    expect(dataValidationError.context).toEqual({
      allowedValue: "type1",
      errorType: "const"
    });
    expect(dataValidationError.path).toEqual("{base}.a.type");
    expect(dataValidationError.suggestion).toBeUndefined();

    // with Zero Errors
    expect(() => new DataValidationError(schema, data, [])).toThrow(
      "Cannot read property 'message' of undefined"
    );

    // with module
    const dataValidationErrorWithModule = new DataValidationError(
      schema,
      data,
      validator.errors,
      "my-module"
    );
    expect(dataValidationErrorWithModule.message).toEqual(
      "DataValidationError<my-module>: 'type' property must be equal to the allowed value"
    );
    expect(dataValidationErrorWithModule.module).toEqual("my-module");
    expect(dataValidationError.context).toEqual({
      allowedValue: "type1",
      errorType: "const"
    });
    expect(dataValidationError.path).toEqual("{base}.a.type");
    expect(dataValidationError.suggestion).toBeUndefined();
    expect(dataValidationErrorWithModule.toObject()).toEqual({
      code: "DataValidationError",
      message: "'type' property must be equal to the allowed value",
      module: "my-module",
      context: {
        allowedValue: "type1",
        errorType: "const"
      },
      path: "{base}.a.type",
      suggestion: undefined
    });
  });

  test("test access denied error", () => {
    // simple
    const accessDeniedError = new AccessDeniedError("my-resource", "my-action");
    expect(accessDeniedError).toBeInstanceOf(SomodError);
    expect(accessDeniedError).toBeInstanceOf(AccessDeniedError);
    expect(accessDeniedError.message).toEqual(
      "AccessDeniedError<>: No permission to perform my-action on my-resource"
    );
    expect(accessDeniedError.resourceType).toEqual("my-resource");
    expect(accessDeniedError.action).toEqual("my-action");
    expect(accessDeniedError.idendifier).toBeUndefined();
    expect(accessDeniedError.module).toEqual("");

    // with string identifier
    const accessDeniedErrorWithStringIdentifier = new AccessDeniedError(
      "my-resource",
      "my-action",
      "my-resource-id"
    );
    expect(accessDeniedErrorWithStringIdentifier.message).toEqual(
      "AccessDeniedError<>: No permission to perform my-action on my-resource with id = 'my-resource-id'"
    );
    expect(accessDeniedErrorWithStringIdentifier.resourceType).toEqual(
      "my-resource"
    );
    expect(accessDeniedErrorWithStringIdentifier.action).toEqual("my-action");
    expect(accessDeniedErrorWithStringIdentifier.idendifier).toEqual(
      "my-resource-id"
    );
    expect(accessDeniedErrorWithStringIdentifier.module).toEqual("");

    // with object identifier
    const accessDeniedErrorWithObjectIdentifier = new AccessDeniedError(
      "my-resource",
      "my-action",
      {
        type: "my-resource-type",
        name: "my-resource-name"
      }
    );
    expect(accessDeniedErrorWithObjectIdentifier.message).toEqual(
      "AccessDeniedError<>: No permission to perform my-action on my-resource with type = 'my-resource-type', name = 'my-resource-name'"
    );
    expect(accessDeniedErrorWithObjectIdentifier.resourceType).toEqual(
      "my-resource"
    );
    expect(accessDeniedErrorWithObjectIdentifier.action).toEqual("my-action");
    expect(accessDeniedErrorWithObjectIdentifier.idendifier).toEqual({
      type: "my-resource-type",
      name: "my-resource-name"
    });
    expect(accessDeniedErrorWithObjectIdentifier.module).toEqual("");

    // with module
    const accessDeniedErrorWithModule = new AccessDeniedError(
      "my-resource",
      "my-action",
      null,
      "my-module"
    );
    expect(accessDeniedErrorWithModule.message).toEqual(
      "AccessDeniedError<my-module>: No permission to perform my-action on my-resource"
    );
    expect(accessDeniedErrorWithModule.resourceType).toEqual("my-resource");
    expect(accessDeniedErrorWithModule.action).toEqual("my-action");
    expect(accessDeniedErrorWithModule.idendifier).toBeNull();
    expect(accessDeniedErrorWithModule.module).toEqual("my-module");
    expect(accessDeniedErrorWithModule.toObject()).toEqual({
      code: "AccessDeniedError",
      message: "No permission to perform my-action on my-resource",
      module: "my-module",
      resourceType: "my-resource",
      action: "my-action",
      idendifier: null
    });
  });
});
