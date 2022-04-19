import { DataValidationError } from "@solib/errors";
import {
  DefaultBodyType,
  DefaultHeaderType,
  DefaultPathParamsType,
  DefaultQueryStringsType,
  EventType,
  HttpRequest,
  ParseAdditionalParamType,
  ParseBodyType,
  ParseHeadersType,
  ParsePathParamsType,
  ParseQueryStringParamsType
} from "../types/types-http-lambda";

export const parseHeaders: ParseHeadersType<DefaultHeaderType> = (
  headers,
  filters
) => {
  return (
    filters?.reduce((map, obj) => {
      map[obj] = headers[obj];
      return map;
    }, {}) || {}
  );
};

export const parsePathParams: ParsePathParamsType<
  DefaultPathParamsType
> = pathParams => {
  return pathParams;
};

export const parseQueryStrings: ParseQueryStringParamsType<
  DefaultQueryStringsType
> = queryStrings => {
  return queryStrings;
};

export const parseBody: ParseBodyType<DefaultBodyType> = (
  body,
  contentType
) => {
  if (contentType?.toLocaleLowerCase() != "application/json") {
    throw new DataValidationError({
      message: `request header content-type must be 'application/json', but received - ${contentType?.toLocaleLowerCase()}`,
      context: { errorType: "Bad Request" },
      path: "Headers"
    });
  }

  return JSON.parse(body);
};

export const parseRequest = <TH, TP, TQ, TB>(
  event: EventType,
  parseHeader?: { parser: ParseHeadersType<TH>; filters: string[] },
  parsePathParams?: ParsePathParamsType<TP>,
  parseQueryStrings?: ParseQueryStringParamsType<TQ>,
  parseBody?: ParseBodyType<TB>
) => {
  const httpInput: HttpRequest<TH, TP, TQ, TB> = {
    httpMethod: event.requestContext.http.method,
    domain: event.requestContext.domainName,
    authorizer: event.requestContext.authorizer?.lambda || null
  };

  if (parseHeader) {
    httpInput.headers = parseHeader.parser(event.headers, parseHeader.filters);
  }
  if (parsePathParams) {
    httpInput.pathParams = parsePathParams(event.pathParameters);
  }
  if (parseQueryStrings) {
    httpInput.queryStringParameters = parseQueryStrings(
      event.queryStringParameters
    );
  }
  if (parseBody) {
    httpInput.body = parseBody(
      event.body,
      event.headers ? event.headers["content-type"] : undefined
    );
  }

  return httpInput;
};

export const parseAdditionalParams: ParseAdditionalParamType = (
  event,
  additionalParamsPath
) => {
  if (!additionalParamsPath) return null;
  const addtionalParams: Record<string, unknown> = {};

  Object.keys(additionalParamsPath).map(paramKey => {
    const pathkeys = additionalParamsPath[paramKey].split("/");
    let paramVal = event;
    Object.keys(pathkeys).map(pathKey => {
      paramVal = (paramVal && paramVal[pathkeys[pathKey]]) || null;
    });
    addtionalParams[paramKey] = paramVal;
  });

  return addtionalParams;
};

export type ParseRequest = typeof parseRequest;
