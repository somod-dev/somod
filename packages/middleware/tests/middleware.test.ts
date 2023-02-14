import { Context } from "aws-lambda";
import { Middleware } from "somod-types";
import { getMiddlewareHandler } from "../src";
import { MiddlewareContext } from "../src/middleware";

const context: Context = {
  callbackWaitsForEmptyEventLoop: false,
  functionName: "",
  functionVersion: "",
  invokedFunctionArn: "",
  memoryLimitInMB: "",
  awsRequestId: "",
  logGroupName: "",
  logStreamName: "",
  getRemainingTimeInMillis: function (): number {
    throw new Error("Function not implemented.");
  },

  /** @deprecated funtions */
  done: jest.fn(),
  fail: jest.fn(),
  succeed: jest.fn()
};

describe("getMiddlewareHandler", () => {
  test("without middlewares", async () => {
    const lambda = jest.fn().mockResolvedValue("TheResult");
    const callback = jest.fn();
    await expect(
      getMiddlewareHandler(lambda, [])({ my: "event" }, context, callback)
    ).resolves.toEqual("TheResult");
    expect(lambda).toHaveBeenCalledTimes(1);
    expect(lambda).toHaveBeenCalledWith(
      { my: "event", somodMiddlewareContext: expect.any(MiddlewareContext) },
      context,
      callback
    );
  });

  test("with middleware not calling next", async () => {
    const lambda = jest.fn().mockResolvedValue("TheResult");
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const middleware: Middleware = jest.fn(async (next, event, context) => {
      return "The Result from Middleware";
    });
    const callback = jest.fn();
    await expect(
      getMiddlewareHandler(lambda, [middleware])(
        { my: "event" },
        context,
        callback
      )
    ).resolves.toEqual("The Result from Middleware");
    expect(lambda).toHaveBeenCalledTimes(0);
    expect(middleware).toHaveBeenCalledTimes(1);
    expect(middleware).toHaveBeenCalledWith(
      expect.any(Function),
      { my: "event", somodMiddlewareContext: expect.any(MiddlewareContext) },
      context
    );
  });

  test("with middleware calling next", async () => {
    const lambda = jest.fn().mockReturnValue("TheResult");
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const middleware: Middleware = jest.fn(async (next, event, context) => {
      return await next();
    });
    const callback = jest.fn();
    await expect(
      getMiddlewareHandler(lambda, [middleware])(
        { my: "event" },
        context,
        callback
      )
    ).resolves.toEqual("TheResult");
    expect(lambda).toHaveBeenCalledTimes(1);
    expect(lambda).toHaveBeenCalledWith(
      { my: "event", somodMiddlewareContext: expect.any(MiddlewareContext) },
      context,
      callback
    );
    expect(middleware).toHaveBeenCalledTimes(1);
    expect(middleware).toHaveBeenCalledWith(
      expect.any(Function),
      { my: "event", somodMiddlewareContext: expect.any(MiddlewareContext) },
      context
    );
  });

  test("the order of execution with multiple middlewares", async () => {
    const lambda = jest.fn().mockResolvedValue("TheResult");
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const middleware1 = jest.fn((async (next, event, context) => {
      await next();
      return "From Middleware1";
    }) as Middleware);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const middleware2 = jest.fn((async (next, event, context) => {
      await next();
      return "From Middleware2";
    }) as Middleware);
    const callback = jest.fn();
    await expect(
      getMiddlewareHandler(lambda, [middleware1, middleware2])(
        { my: "event" },
        context,
        callback
      )
    ).resolves.toEqual("From Middleware2");

    expect(lambda).toHaveBeenCalledTimes(1);
    expect(lambda).toHaveBeenCalledWith(
      { my: "event", somodMiddlewareContext: expect.any(MiddlewareContext) },
      context,
      callback
    );
    expect(middleware1).toHaveBeenCalledTimes(1);
    expect(middleware1).toHaveBeenCalledWith(
      expect.any(Function),
      { my: "event", somodMiddlewareContext: expect.any(MiddlewareContext) },
      context
    );
    expect(middleware2).toHaveBeenCalledTimes(1);
    expect(middleware2).toHaveBeenCalledWith(
      expect.any(Function),
      { my: "event", somodMiddlewareContext: expect.any(MiddlewareContext) },
      context
    );

    expect(middleware2.mock.invocationCallOrder[0]).toBeLessThan(
      middleware1.mock.invocationCallOrder[0]
    );
    expect(middleware1.mock.invocationCallOrder[0]).toBeLessThan(
      lambda.mock.invocationCallOrder[0]
    );
  });
});
