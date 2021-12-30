import Ajv, { ValidateFunction, ErrorObject } from "ajv";
import addFormats from "ajv-formats";
import { JSONSchema7 } from "json-schema";

export class JSONValidationError extends Error {
  private _errors: ErrorObject[] = [];
  constructor(errors: ErrorObject[]) {
    super(errors.map(e => e.message).join("\n"));

    this._errors = errors;

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, new.target.prototype);
  }

  get errors(): ErrorObject[] {
    return [...this._errors];
  }
}

export const getAjv = (): Ajv => {
  const ajv = new Ajv();
  addFormats(ajv);
  return ajv;
};

export const getValidator = <T = unknown>(
  schema: JSONSchema7,
  ajv?: Ajv
): ValidateFunction<T> => {
  const _ajv = ajv || getAjv();
  return _ajv.compile(schema);
};

/**
 * @param schema a valid JSON Schema is ignored if validate function is passed
 * @param data
 * @param validate
 */
export const validate = <T = unknown>(
  schema: JSONSchema7,
  data: T,
  validate?: ValidateFunction<T>
): void => {
  const _validate = validate || getValidator(schema);
  if (!_validate(data)) {
    throw new JSONValidationError(_validate.errors);
  }
};
