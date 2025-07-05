import { Context, Handler } from "aws-lambda";
import {
  Middleware,
  IMiddlewareContext,
  EventWithMiddlewareContext
} from "somod-types";

export class MiddlewareContext implements IMiddlewareContext {
  private context: Record<string, unknown> = {};

  constructor() {
    Object.setPrototypeOf(this, new.target.prototype);
  }

  set(key: string, value: unknown) {
    this.context[key] = value;
  }

  get(key: string) {
    return this.context[key];
  }
}

const executeLambda = async <
  TEvent = Record<string, unknown>,
  TResult = unknown
>(
  lambda: Handler<TEvent, TResult>,
  event: TEvent,
  context: Context
): Promise<TResult> => {
  let lambdaResult: void | Promise<TResult> | TResult = lambda(
    event,
    context,
    null
  );

  while (typeof lambdaResult?.["then"] === "function") {
    lambdaResult = await lambdaResult;
  }

  return lambdaResult as TResult;
};

export const getMiddlewareHandler = <
  TEvent extends Record<string, unknown> = Record<string, unknown>,
  TResult = unknown
>(
  lambda: Handler<TEvent, TResult>,
  middlewares: Middleware<TEvent, TResult>[]
): Handler<TEvent, TResult> => {
  return async (event, context) => {
    const eventWithContext = {
      ...event,
      somodMiddlewareContext: new MiddlewareContext()
    } as EventWithMiddlewareContext<TEvent>;

    let step = middlewares.length;
    const next = async () => {
      if (step > 0) {
        const middleware = middlewares[--step];
        const result = await middleware(next, eventWithContext, context);
        return result;
      } else {
        const lambdaResult = await executeLambda(
          lambda,
          eventWithContext,
          context
        );
        return lambdaResult;
      }
    };

    return await next();
  };
};
