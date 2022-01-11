import { ErrorObject } from "ajv";
import { JSONSchema6, JSONSchema7 } from "json-schema";
import { cloneDeep, isString, uniq } from "lodash";
import { ValidationError, betterAjvErrors } from "@apideck/better-ajv-errors";

export type Identifier = string | Record<string, string>;

const identifierToString = (identifier: Identifier): string => {
  const idStr = isString(identifier)
    ? `id = '${identifier}'`
    : Object.keys(identifier)
        .map(idKey => `${idKey} = '${identifier[idKey]}'`)
        .join(", ");
  return idStr;
};

export type SomodErrorObject = {
  message: string;
  module?: string;
} & Record<string, unknown>;

export abstract class SomodError extends Error {
  private _module: string;
  private _code: string;
  constructor(code: string, message?: string, module?: string) {
    const __module = module || "";
    super(`${code}<${__module}>: ${message}`);
    this._code = code;
    this._module = __module;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  get module() {
    return this._module;
  }

  get code() {
    return this._code;
  }

  toObject(): SomodErrorObject {
    let properties: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let prototypeChain = this;
    while (Object.getPrototypeOf(prototypeChain)) {
      const descriptors = Object.getOwnPropertyDescriptors(prototypeChain);
      Object.keys(descriptors).forEach(property => {
        if (!descriptors[property].enumerable) {
          properties.push(property);
        }
      });
      prototypeChain = Object.getPrototypeOf(prototypeChain);
    }
    properties = properties.filter(
      property =>
        ![
          "stack",
          "constructor",
          "toString",
          "name",
          "code",
          "message",
          "module"
        ].includes(property)
    );
    properties = uniq(properties);
    const theErrorObject: SomodErrorObject = {
      code: this.code,
      message: this.message.substring(`${this.code}<${this.module}>: `.length),
      module: this.module
    };
    properties.forEach(property => {
      theErrorObject[property] = this[property];
    });

    return theErrorObject;
  }
}

export class ResourceNotFoundError extends SomodError {
  private _resourceType: string;
  private _identifier: Identifier;
  constructor(resourceType: string, identifier: Identifier, module?: string) {
    const message = `${resourceType} with ${identifierToString(
      identifier
    )} not found`;
    super("ResourceNotFoundError", message, module);
    this._resourceType = resourceType;
    this._identifier = cloneDeep(identifier);

    Object.setPrototypeOf(this, new.target.prototype);
  }

  get resourceType() {
    return this._resourceType;
  }

  get identifier() {
    return cloneDeep(this._identifier);
  }
}

export class DuplicateResourceError extends SomodError {
  private _resourceType: string;
  private _identifier: Identifier;

  constructor(resourceType: string, identifier: Identifier, module?: string) {
    const message = `${resourceType} with ${identifierToString(
      identifier
    )} exists`;
    super("DuplicateResourceError", message, module);
    this._resourceType = resourceType;
    this._identifier = cloneDeep(identifier);

    Object.setPrototypeOf(this, new.target.prototype);
  }

  get resourceType() {
    return this._resourceType;
  }

  get identifier() {
    return cloneDeep(this._identifier);
  }
}

export class DataValidationError extends SomodError {
  private _error: ValidationError;

  /**
   * errors must contain atleast one error
   *
   * caller of this constructor must ensure that `the number of errors in more than 0`
   */
  constructor(
    schema: JSONSchema7,
    data: unknown,
    errors: ErrorObject[],
    module?: string
  ) {
    const _errors = betterAjvErrors({
      errors,
      data,
      schema: schema as JSONSchema6
    });
    const error = _errors.shift();
    super("DataValidationError", error.message, module);
    this._error = error;

    Object.setPrototypeOf(this, new.target.prototype);
  }

  get context() {
    return cloneDeep(this._error.context);
  }

  get path() {
    return this._error.path;
  }

  get suggestion() {
    return this._error.suggestion;
  }
}

export class AccessDeniedError extends SomodError {
  private _resourceType: string;
  private _action: string;
  private _identifier: Identifier;

  constructor(
    resourceType: string,
    action: string,
    identifier?: Identifier,
    module?: string
  ) {
    let message = `No permission to perform ${action} on ${resourceType}`;
    if (identifier) {
      message += ` with ${identifierToString(identifier)}`;
    }
    super("AccessDeniedError", message, module);

    this._resourceType = resourceType;
    this._action = action;
    this._identifier = cloneDeep(identifier);
  }

  get resourceType() {
    return this._resourceType;
  }

  get action() {
    return this._action;
  }

  get idendifier() {
    return cloneDeep(this._identifier);
  }
}
