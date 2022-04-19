import { InternalServerError } from "@solib/errors";
import { errorHandler } from "./errorHandler/errorHandler";
import {
  httpResolver,
  lambdaResponseHandler
} from "./resolver/requestResolver";
import {
  DefaultBodyType,
  DefaultHeaderType,
  DefaultPathParamsType,
  DefaultQueryStringsType,
  EventType,
  HttpHandlerType,
  HttpResponse,
  LambdaCallbackType,
  Options,
  RegisterType
} from "./types/types-http-lambda";

export class HttpLambda {
  private params: Record<string, HttpHandlerType> = {};

  register = <
    TH = DefaultHeaderType,
    TP = DefaultPathParamsType,
    TQ = DefaultQueryStringsType,
    TB = DefaultBodyType
  >(
    param: RegisterType<TH, TP, TQ, TB>
  ) => {
    this.params[
      param.httpMethod.toLocaleLowerCase() +
        " " +
        param.path.toLocaleLowerCase()
    ] = {
      lambdaFn: param.lambdaFn as unknown as LambdaCallbackType,
      options: param.options as unknown as Options
    };
  };

  getHandler = () => {
    return async (event: EventType): Promise<HttpResponse> => {
      const param = this.params[event.routeKey.toLocaleLowerCase()];

      if (!param) {
        return errorHandler(
          new InternalServerError(
            new Error(
              "Url not registered ( url is combination of http method and path)"
            )
          )
        );
      }

      if (
        event.headers &&
        event.headers["sodaru-http-meta"] &&
        event.headers["sodaru-http-meta"].toLocaleLowerCase() === "true"
      ) {
        return lambdaResponseHandler({
          request: {
            schemas: {
              header: param.options?.headers?.schema || null,
              body: param.options?.body?.schema || null,
              pathParameter: param.options?.pathParams?.schema || null,
              queryString: param.options?.queryStrings?.schema || null
            }
          },
          response: {
            code: param.options?.statusCode || 200,
            headers: param.options?.responseHeaders || null
          }
        });
      }

      return await httpResolver(event, param.lambdaFn, param.options);
    };
  };
}
