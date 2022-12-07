import { Context } from "aws-lambda";

export interface IMiddlewareContext {
  set(key: string, value: unknown): void;

  get(key: string): unknown;
}

export type EventWithMiddlewareContext<TEvent extends Record<string, unknown>> =
  TEvent & {
    somodMiddlewareContext: IMiddlewareContext;
  };

export type Middleware<
  TEvent extends Record<string, unknown> = Record<string, unknown>,
  TResult = unknown
> = (
  next: () => Promise<TResult>,
  event: Readonly<EventWithMiddlewareContext<TEvent>>,
  context: Readonly<Context>
) => Promise<TResult>;
