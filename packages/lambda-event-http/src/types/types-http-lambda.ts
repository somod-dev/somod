import {
  APIGatewayProxyEventHeaders,
  APIGatewayProxyEventQueryStringParameters,
  APIGatewayProxyEventV2WithLambdaAuthorizer
} from "aws-lambda";
import { JSONSchema7 } from "json-schema";

export type AuthorizerContextType = Record<string, unknown>;
export type DefaultHeaderType = Record<string, string>;
export type DefaultPathParamsType = Record<string, string>;
export type DefaultQueryStringsType = Record<string, string>;
export type DefaultBodyType = Record<string, unknown>;

export type HttpRequest<TH, TP, TQ, TB> = {
  headers?: TH;
  httpMethod: string;
  domain: string;
  pathParams?: TP;
  queryStringParameters?: TQ;
  body?: TB;
  authorizer: AuthorizerContextType;
};

export type HttpResponse = {
  statusCode: number;
  body?: string;
  headers?: Record<string, string>;
};

export type ParseHeadersType<TH> = (
  headers: APIGatewayProxyEventHeaders,
  filters?: string[]
) => TH;

export type ParsePathParamsType<TP> = (
  pathParams: Record<string, string>
) => TP;
export type ParseQueryStringParamsType<TQ> = (
  queryStringParams: APIGatewayProxyEventQueryStringParameters
) => TQ;
export type ParseBodyType<TB> = (body: string, contentType: string) => TB;

type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<
  T,
  Exclude<keyof T, Keys>
> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
  }[Keys];

export type Options<
  TH = DefaultHeaderType,
  TP = DefaultPathParamsType,
  TQ = DefaultQueryStringsType,
  TB = DefaultBodyType
> = {
  headers?: {
    fnParser?: ParseHeadersType<TH>;
    filters?: string[];
  } & RequireAtLeastOne<{
    schema: JSONSchema7;
    fnValidator: ValidateHeadersType<TH>;
  }>;

  pathParams?: {
    fnParser?: ParsePathParamsType<TP>;
    filters?: string[];
  } & RequireAtLeastOne<{
    schema: JSONSchema7;
    fnValidator: ValidatePathParamsType<TP>;
  }>;

  queryStrings?: {
    fnParser?: ParseQueryStringParamsType<TQ>;
  } & RequireAtLeastOne<{
    schema: JSONSchema7;
    fnValidator: ValidateQueryStringParamsType<TQ>;
  }>;

  body?: {
    fnParser?: ParseBodyType<TB>;
  } & RequireAtLeastOne<{
    schema: JSONSchema7;
    fnValidator: ValidateBodyType<TB>;
  }>;
  statusCode?: number;
  responseHeaders?: Record<string, string>;
  additionalParams?: RequireAtLeastOne<{
    fnAdditionalParams: ParseAdditionalParamType;
    additionalParamsPath: Record<AdditionalParam, EventAdditionalParamPath>;
  }>;
};

export type ParseAdditionalParamType = (
  event: EventType,
  additonalParamPath?: Record<AdditionalParam, EventAdditionalParamPath>
) => Record<string, unknown>;

export type AdditionalParam = string;
export type EventAdditionalParamPath = string;

export type ValidateHeadersType<TH> = (headerParams: TH) => void;

export type ValidatePathParamsType<TP> = (pathParams: TP) => void;

export type ValidateQueryStringParamsType<TQ> = (aueryStringParams: TQ) => void;

export type ValidateBodyType<TB> = (body: TB) => void;

export type EventType =
  APIGatewayProxyEventV2WithLambdaAuthorizer<AuthorizerContextType>;

export type LambdaCallbackType<
  TH = DefaultHeaderType,
  TP = DefaultPathParamsType,
  TQ = DefaultQueryStringsType,
  TB = DefaultBodyType
> = (
  request: HttpRequest<TH, TP, TQ, TB>,
  addtionalParams?: Record<string, unknown>
) => Promise<string | Record<string, unknown> | void>;

export type RegisterType<
  TH = DefaultHeaderType,
  TP = DefaultPathParamsType,
  TQ = DefaultQueryStringsType,
  TB = DefaultBodyType
> = {
  httpMethod: string;
  path: string;
} & HttpHandlerType<TH, TP, TQ, TB>;

export type HttpHandlerType<
  TH = DefaultHeaderType,
  TP = DefaultPathParamsType,
  TQ = DefaultQueryStringsType,
  TB = DefaultBodyType
> = {
  lambdaFn: LambdaCallbackType<TH, TP, TQ, TB>;
  options?: Options<TH, TP, TQ, TB>;
};
