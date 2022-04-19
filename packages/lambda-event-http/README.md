# Http lambda

`this module requires knowledge of `[JsonSchema7](https://json-schema.org/understanding-json-schema/) \
A generic wrapper around lambda functions facing http request.

1. **Parse**

- `event` - to parse **_event_** object which is default input sent by aws api gateway to lambda, only **version 2.0** is supported. see [event](https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-develop-integrations-lambda.html) for more details.

2. **validate**

- to validate parameters, pass only [jsonschema7](https://json-schema.org/understanding-json-schema/) format for validation.
- output from parse funtions will be passed as input to validate function.

3. **call lambda function**

- passed lambda function is called with input parameter derived as output from parse function in step 1.

## Installation

```bash
npm install http-lambda
```

## Usage

create object of `HttpLambda` and call `register` method to register multiple functions connecting to different paths of aws api gateway.

```typescript
register<TH, TP, TQ, TB>(param: RegisterType<TH, TP, TQ, TB>) : HttpResponse
```

`TH, TP, TQ, TB` - represent return types form parsers.

- TH - header parser
- TP - path parameters parser
- TQ - query parameters parser
- TB - body parser

If type is not specified default types will be used.
see [Default types](#default-implementations) for more details.

## Meata data

If the request header contains parameter `sodaru-http-meta` then the metadata of the function will be returned wihout calling the registered lambda function.

_for example_

```curl
curl -X PUT <url> -H "sodaru-http-meta: true"
```

this will return metada of the registerd function.

_output_

```
{
  "request": {
    "schemas": {
      "header": null, //null if schema is absent
      "body": {
        "type": "object"
      },
      "pathParameter": {
          type: "object",
          additionalProperties: false,
          patternProperties: {
            id: { type: "string" }
          }
        },
      "queryString": {
        "type": "string"
      }
    }
  },
  "response": {
    "code": 200,
    "headers": null
  }
}
```

## Parameters

```ts
HttpInputType<TH, TP, TQ, TB> = {
  path: string;
  httpMethod: string;
} & HttpHandlerType<TH, TP, TQ, TB>>;
```

`path` : match this value with **_event.requestContext.http.path_** \
`method` : match this value with **_event.requestContext.http.method_**

`path` and `method` together used as key to differentiate registered `HttpHandlerType`

**Note**:

1. In case of duplicate registries latest one will be used.
2. If schema is not provided inside `options` the corresponding values will not be parsed and they cannot be used inside lambada function.

`event` - [explained above](#http-lambda)

```
HttpHandlerType<TH, TP, TQ, TB> = {
  lambdaFn: LambdaCallbackType<TH, TP, TQ, TB>;
  options?: Options<TH, TP, TQ, TB>;
}
```

- [lambdaFn](#lambda-function)
- [options](#options)

## Output

### HttpResponse

```
type HttpResponse = {
  statusCode: number;
  body?: string;
  headers?: Record<string, string>;
}
```

`statusCode` response status code, can be specified through `options` input
`body` response value from lambda funciton
`headers` response headers, can be specified through `options` input. By default `content-type` response header is added if not specified.

## lambda function

The lambda function written by users.

```
<TH, TP, TQ, TB>lambdaFn(request: HttpRequest) : Promise<string | Record<string, unknown> | void>
```

if <TH, TP, TQ, TB> types are not specified defaults will be used.

- request: HttpRequest type

```
type HttpRequest<TH, TP, TQ, TB> = {
  headers?: TH;
  httpMethod: string;
  domain: string;
  pathParams?: TP;
  queryStringParameters?: TQ;
  body?: TB;
  authorizer: Record<string, unknown>;
}
```

`domain` `httpMethod` and `authorizer` values are retrieved from `event` object by default.

- output should be of type

```
   Promise<string | Record<string, unknown> | void>
```

## Options

gives flexibility to define custom types. Users can define custom parsers/validators/response headers etc.

```
type Options<
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
};
```

all the options above are optional. If any option is specified then one of `schema` or `fnValidator` is mandatory. Custom parser or validator will be used if passed else default functions will be used.

- `fnParser` - custom parser function
- `filters` - filters for parsing. If empty this input is ignored.
- `schema` - JSONSchema7 used for validation
- `fnValidator` - custom validator function
- `statusCode` - refer error codes from project [Erros](https://gitlab.com/sodaru/solib/errors/-/blob/main/README.md). For success 200 is used by default.
- `responseHeaders` - custom response headers.

## Default implementations

### default types

- TH - Record<string, string>
- TP - Record<string, string>
- TQ - Record<string, string>
- TB - Record<string, unknown>

There are 4 parsers and 4 validators available now.

- Parsers - takes `event` as input

  - Header parser - parse header values
  - path parameters parser - parse path parameters
  - query strings parser - parse query string parameters
  - body parser - parse input body

- Validators - each validator takes out put from corresponding parser as input.\
   for example :- Input for **Header validator** will be output from **Header parser**.
  - Header validator - validate headers
  - path parameters validator - validate path parameters
  - querystring parameters validator - validate querystring parameters
  - body validator - validate body
