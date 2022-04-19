import { validate } from "@solib/json-validator";
import { JSONSchema7 } from "json-schema";
import {
  DefaultBodyType,
  DefaultHeaderType,
  DefaultPathParamsType,
  DefaultQueryStringsType,
  HttpRequest,
  ValidateBodyType,
  ValidateHeadersType,
  ValidatePathParamsType,
  ValidateQueryStringParamsType
} from "../types/types-http-lambda";

export const getDefaultHeaderValidator: (
  schema: JSONSchema7
) => ValidateHeadersType<DefaultHeaderType> = schema => {
  return headers => {
    validate(schema, headers);
  };
};

export const getDefaultPathParamsValidator: (
  schema: JSONSchema7
) => ValidatePathParamsType<DefaultPathParamsType> = schema => {
  return pathParams => {
    validate(schema, pathParams);
  };
};

export const getDefaultQueryParamValidator: (
  schema: JSONSchema7
) => ValidateQueryStringParamsType<DefaultQueryStringsType> = schema => {
  return queryStringParams => {
    validate(schema, queryStringParams);
  };
};

export const getDefaultBodyValidator: (
  schema: JSONSchema7
) => ValidateBodyType<DefaultBodyType> = schema => {
  return body => {
    validate(schema, body);
  };
};

export const validateRequest = <TH, TP, TQ, TB>(
  request: HttpRequest<TH, TP, TQ, TB>,
  headers?: ValidateHeadersType<TH>,
  pathParams?: ValidatePathParamsType<TP>,
  queryStringParams?: ValidateQueryStringParamsType<TQ>,
  body?: ValidateBodyType<TB>
) => {
  if (headers) {
    headers(request.headers);
  }
  if (pathParams) {
    pathParams(request.pathParams);
  }
  if (queryStringParams) {
    queryStringParams(request.queryStringParameters);
  }
  if (body) {
    body(request.body);
  }
};
