import { errorHandler } from "../errorHandler/errorHandler";
import {
  parseAdditionalParams,
  parseBody,
  parseHeaders,
  parsePathParams,
  parseQueryStrings,
  parseRequest
} from "../parser/inputParser";
import {
  EventType,
  HttpRequest,
  HttpResponse,
  LambdaCallbackType,
  Options,
  ParseBodyType,
  ParseHeadersType,
  ParsePathParamsType,
  ParseQueryStringParamsType,
  ValidateBodyType,
  ValidateHeadersType,
  ValidatePathParamsType,
  ValidateQueryStringParamsType
} from "../types/types-http-lambda";
import {
  getDefaultBodyValidator,
  getDefaultHeaderValidator,
  getDefaultPathParamsValidator,
  getDefaultQueryParamValidator,
  validateRequest
} from "../validator/inputValidator";

export const httpResolver = async <TH, TP, TQ, TB>(
  event: EventType,
  lambdaFn: LambdaCallbackType<TH, TP, TQ, TB>,
  options?: Options<TH, TP, TQ, TB>
): Promise<HttpResponse> => {
  let httpRquest: HttpRequest<TH, TP, TQ, TB> = null;

  try {
    const headerParser: {
      parser: ParseHeadersType<TH>;
      filters: string[];
    } = options?.headers
      ? {
          parser:
            options.headers.fnParser ||
            (parseHeaders as unknown as ParseHeadersType<TH>),
          filters: options.headers.filters
        }
      : null;

    const pathParamParser: ParsePathParamsType<TP> = options?.pathParams
      ? options.pathParams.fnParser ||
        (parsePathParams as unknown as ParsePathParamsType<TP>)
      : null;

    const queryParamParser: ParseQueryStringParamsType<TQ> =
      options?.queryStrings
        ? options.queryStrings.fnParser ||
          (parseQueryStrings as unknown as ParseQueryStringParamsType<TQ>)
        : null;

    const bodyParser: ParseBodyType<TB> = options?.body
      ? options.body.fnParser || (parseBody as unknown as ParseBodyType<TB>)
      : null;

    httpRquest = parseRequest(
      event,
      headerParser,
      pathParamParser,
      queryParamParser,
      bodyParser
    );

    const headerValidator: ValidateHeadersType<TH> = options?.headers
      ? options.headers.fnValidator ||
        (getDefaultHeaderValidator(
          options.headers.schema
        ) as unknown as ValidateHeadersType<TH>)
      : null;

    const pathParamValidator: ValidatePathParamsType<TP> = options?.pathParams
      ? options.pathParams.fnValidator ||
        (getDefaultPathParamsValidator(
          options.pathParams.schema
        ) as unknown as ValidatePathParamsType<TP>)
      : null;

    const queryParamValidator: ValidateQueryStringParamsType<TQ> =
      options?.queryStrings
        ? options.queryStrings.fnValidator ||
          (getDefaultQueryParamValidator(
            options.queryStrings.schema
          ) as unknown as ValidateQueryStringParamsType<TQ>)
        : null;

    const bodyValidator: ValidateBodyType<TB> = options?.body
      ? options.body.fnValidator ||
        (getDefaultBodyValidator(
          options.body.schema
        ) as unknown as ValidateBodyType<TB>)
      : null;

    validateRequest(
      httpRquest,
      headerValidator,
      pathParamValidator,
      queryParamValidator,
      bodyValidator
    );

    const fnAdditionalParams = options?.additionalParams
      ? options.additionalParams.fnAdditionalParams || parseAdditionalParams
      : null;

    const additionalParams = fnAdditionalParams
      ? fnAdditionalParams(
          event,
          options.additionalParams?.additionalParamsPath
        )
      : null;

    const result = await lambdaFn(httpRquest, additionalParams);

    return lambdaResponseHandler(
      result,
      options?.statusCode,
      options?.responseHeaders
    );
  } catch (e) {
    return errorHandler(e);
  }
};

export const lambdaResponseHandler = (
  result: string | void | Record<string, unknown>,
  statusCode?: number,
  headers?: Record<string, string>
): HttpResponse => {
  headers = headers || {};
  headers["content-type"] =
    headers["content-type"] ||
    (result && typeof result == "object" ? "application/json" : "text/plain");

  return {
    statusCode: statusCode || 200,
    body: result
      ? typeof result === "object"
        ? JSON.stringify(result)
        : result
      : "",
    headers: headers
  };
};
