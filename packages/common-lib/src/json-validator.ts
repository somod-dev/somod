import Ajv, { ValidateFunction } from "ajv";
import addFormats from "ajv-formats";
import { JSONSchema7 } from "json-schema";
import { DataValidationError } from "./errors";

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
  validate?: ValidateFunction<T>,
  module?: string
): void => {
  const _validate = validate || getValidator(schema);
  if (!_validate(data)) {
    throw new DataValidationError(schema, data, _validate.errors, module);
  }
};
