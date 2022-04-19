import {
  CloudFormationCustomResourceEvent,
  CloudFormationCustomResourceEventCommon,
  CloudFormationCustomResourceFailedResponse,
  CloudFormationCustomResourceResponse,
  CloudFormationCustomResourceSuccessResponse
} from "aws-lambda";
import { JSONSchema7 } from "json-schema";
import {
  applyEvent,
  createResponse,
  logEvent,
  sendResponse,
  timedPromise
} from "../src/customResource";
import {
  HandlerResult,
  ResourceAttributes,
  ResourceContext
} from "../src/types";
import { request } from "https";

const httpsRequestWriteFn = jest.fn();
const httpsRequestEndFn = jest.fn();
let successfullHttpsResponse = true;
let httpsResponseStatusCode = 200;

jest.mock("https", () => {
  const originalModule = jest.requireActual("https");

  //Mock the default export and named export 'foo'
  return {
    __esModule: true,
    ...originalModule,
    request: jest.fn().mockImplementation((url, options, callback) => {
      callback({
        on: (event, listener) => {
          if (event == "end" && successfullHttpsResponse) {
            listener();
          }
        },
        statusCode: httpsResponseStatusCode,
        statusMessage: "https-mocked-status-message"
      });

      return {
        on: (event, listener) => {
          if (event == "error" && !successfullHttpsResponse) {
            listener(new Error("https request failed"));
          }
        },
        write: httpsRequestWriteFn,
        end: httpsRequestEndFn
      };
    })
  };
});

describe("Test customResource", () => {
  const StackId = "st1";
  const RequestId = "req1";
  const LogicalResourceId = "Logicle1";
  const ServiceToken = "serviceTkn1";
  const ResourceType = "Custom::R1";
  const ResponseURL = "http://localhost";
  const resourceParams = { p1: { value: "v1" }, p2: "v2" };

  const event: CloudFormationCustomResourceEventCommon = {
    StackId,
    RequestId,
    LogicalResourceId,
    ResourceProperties: { ServiceToken, ...resourceParams },
    ServiceToken,
    ResourceType,
    ResponseURL
  };

  describe("timedPromise", () => {
    test("times out", async () => {
      let timeoutId;
      const p = new Promise<void>(resolve => {
        timeoutId = setTimeout(() => {
          resolve();
        }, 2000);
      });

      await expect(timedPromise(p, 500)).rejects.toEqual(
        new Error(
          "Promise is failed to complete within in timeout of 500 milliseconds"
        )
      );
      clearTimeout(timeoutId);
    });

    test("does not times out", async () => {
      const p = new Promise<void>(resolve => {
        setTimeout(() => {
          resolve();
        }, 200);
      });

      await expect(timedPromise(p, 500)).resolves.toBeUndefined();
    });
  });

  describe("createResponse", () => {
    test("for failed result", () => {
      expect(
        createResponse(
          { StackId, RequestId, LogicalResourceId },
          "custom resource creation failed",
          false
        )
      ).toEqual({
        Status: "FAILED",
        Reason: "custom resource creation failed",
        StackId,
        RequestId,
        LogicalResourceId,
        PhysicalResourceId: [StackId, LogicalResourceId, RequestId].join("/")
      } as CloudFormationCustomResourceFailedResponse);
    });

    test("for failed result with physicalResourceId in event", () => {
      expect(
        createResponse(
          { StackId, RequestId, LogicalResourceId, PhysicalResourceId: "phy1" },
          "custom resource creation failed",
          false
        )
      ).toEqual({
        Status: "FAILED",
        Reason: "custom resource creation failed",
        StackId,
        RequestId,
        LogicalResourceId,
        PhysicalResourceId: "phy1"
      } as CloudFormationCustomResourceFailedResponse);
    });

    test("for success result", () => {
      expect(
        createResponse(
          { StackId, RequestId, LogicalResourceId },
          { physicalResourceId: "phy2", attributes: {} },
          false
        )
      ).toEqual({
        Status: "SUCCESS",
        StackId,
        RequestId,
        LogicalResourceId,
        PhysicalResourceId: "phy2",
        Data: {},
        NoEcho: false
      } as CloudFormationCustomResourceSuccessResponse);
    });

    test("for success result with physicalResourceId in event and some data and noEcho true", () => {
      expect(
        createResponse(
          { StackId, RequestId, LogicalResourceId, PhysicalResourceId: "phy1" },
          { physicalResourceId: "phy2", attributes: { a: "1", b: "20" } },
          true
        )
      ).toEqual({
        Status: "SUCCESS",
        StackId,
        RequestId,
        LogicalResourceId,
        PhysicalResourceId: "phy2",
        Data: { a: "1", b: "20" },
        NoEcho: true
      } as CloudFormationCustomResourceSuccessResponse);
    });
  });

  describe("applyEvent", () => {
    const createHandler = jest.fn();
    const updateHandler = jest.fn();
    const deleteHandler = jest.fn();
    const schema: JSONSchema7 = { type: "object" };

    const handlerResult: HandlerResult<ResourceAttributes> = {
      physicalResourceId: "phy1",
      attributes: { k1: "v1", k2: "v2" }
    };

    beforeEach(() => {
      createHandler.mockResolvedValue(handlerResult);
      updateHandler.mockResolvedValue(handlerResult);
      deleteHandler.mockResolvedValue(handlerResult);
    });

    afterEach(() => {
      createHandler.mockReset();
      updateHandler.mockReset();
      deleteHandler.mockReset();
    });

    test("createEvent", async () => {
      await expect(
        applyEvent(
          { ...event, RequestType: "Create" },
          schema,
          createHandler,
          updateHandler,
          deleteHandler,
          []
        )
      ).resolves.toEqual(handlerResult);
      expect(createHandler).toHaveBeenCalledWith(resourceParams, {
        stackId: StackId,
        requestId: RequestId,
        logicalResourceId: LogicalResourceId,
        resourceType: ResourceType
      } as ResourceContext);
      expect(updateHandler).not.toHaveBeenCalled();
      expect(deleteHandler).not.toHaveBeenCalled();
    });

    test("updateEvent", async () => {
      await expect(
        applyEvent(
          {
            ...event,
            RequestType: "Update",
            PhysicalResourceId: "phy1",
            OldResourceProperties: { p3: "v3" }
          },
          schema,
          createHandler,
          updateHandler,
          deleteHandler,
          []
        )
      ).resolves.toEqual(handlerResult);
      expect(createHandler).not.toHaveBeenCalled();
      expect(updateHandler).toHaveBeenCalledWith(
        "phy1",
        resourceParams,
        {
          p3: "v3"
        },
        {
          stackId: StackId,
          requestId: RequestId,
          logicalResourceId: LogicalResourceId,
          resourceType: ResourceType
        } as ResourceContext
      );
      expect(deleteHandler).not.toHaveBeenCalled();
    });

    test("deleteEvent", async () => {
      await expect(
        applyEvent(
          {
            ...event,
            RequestType: "Delete",
            PhysicalResourceId: "phy1"
          },
          schema,
          createHandler,
          updateHandler,
          deleteHandler,
          []
        )
      ).resolves.toEqual(handlerResult);
      expect(createHandler).not.toHaveBeenCalled();
      expect(updateHandler).not.toHaveBeenCalled();
      expect(deleteHandler).toHaveBeenCalledWith("phy1", resourceParams, {
        stackId: StackId,
        requestId: RequestId,
        logicalResourceId: LogicalResourceId,
        resourceType: ResourceType
      } as ResourceContext);
    });

    test("updateEvent with replacement", async () => {
      await expect(
        applyEvent(
          {
            ...event,
            RequestType: "Update",
            PhysicalResourceId: "phy2",
            OldResourceProperties: { p3: "v3", p2: "value2" }
          },
          schema,
          createHandler,
          updateHandler,
          deleteHandler,
          ["p2"]
        )
      ).resolves.toEqual(handlerResult);
      expect(createHandler).toHaveBeenCalledWith(resourceParams, {
        stackId: StackId,
        requestId: RequestId,
        logicalResourceId: LogicalResourceId,
        resourceType: ResourceType
      } as ResourceContext);
      expect(updateHandler).not.toHaveBeenCalled();
      expect(deleteHandler).not.toHaveBeenCalled();
    });

    test("for validation failure", async () => {
      await expect(
        applyEvent(
          {
            ...event,
            RequestType: "Update",
            PhysicalResourceId: "phy2",
            OldResourceProperties: { p3: "v3", p2: "value2" }
          },
          {
            type: "object",
            additionalProperties: false,
            properties: { prop1: { type: "string" } }
          },
          createHandler,
          updateHandler,
          deleteHandler,
          ["p2"]
        )
      ).rejects.toEqual(
        new Error(
          "DataValidationError<>: 'p1' property is not expected to be here"
        )
      );
      expect(createHandler).not.toHaveBeenCalled();
      expect(updateHandler).not.toHaveBeenCalled();
      expect(deleteHandler).not.toHaveBeenCalled();
    });
  });

  describe("logEvent", () => {
    // eslint-disable-next-line no-console
    const original = console.log;
    beforeEach(() => {
      // eslint-disable-next-line no-console
      console.log = jest.fn();
    });

    afterEach(() => {
      // eslint-disable-next-line no-console
      console.log = original;
    });

    test("test", () => {
      const _event: CloudFormationCustomResourceEvent = {
        ...event,
        RequestType: "Update",
        PhysicalResourceId: "phy1",
        OldResourceProperties: { p2: "val2" }
      };
      expect(logEvent(_event)).toBeUndefined();

      const expected = { ..._event };

      delete expected.ResourceProperties;
      delete expected.OldResourceProperties;

      // eslint-disable-next-line no-console
      expect(console.log).toHaveBeenCalledWith(expected);
    });
  });

  describe("sendResponse", () => {
    beforeEach(() => {
      httpsRequestWriteFn.mockReset();
      httpsRequestEndFn.mockReset();
      successfullHttpsResponse = true;
      httpsResponseStatusCode = 200;
    });

    test("for failed result", async () => {
      const response: CloudFormationCustomResourceResponse = {
        Status: "FAILED",
        PhysicalResourceId: "phy1",
        LogicalResourceId,
        Reason: "custom resource failed",
        RequestId,
        StackId
      };
      await expect(
        sendResponse("http://localhost:3000", response)
      ).resolves.toBeUndefined();
      expect(request).toHaveBeenCalledWith(
        "http://localhost:3000",
        {
          headers: {
            "Content-Length": JSON.stringify(response).length,
            "Content-Type": "application/json"
          },
          method: "PUT"
        },
        expect.any(Function)
      );
      expect(httpsRequestWriteFn).toHaveBeenCalledWith(
        JSON.stringify(response)
      );
      expect(httpsRequestEndFn).toHaveBeenCalledWith();
    });

    test("for success result", async () => {
      const response: CloudFormationCustomResourceResponse = {
        Status: "SUCCESS",
        PhysicalResourceId: "phy1",
        Data: { p1: "V1", p2: "V2" },
        NoEcho: true,
        LogicalResourceId,
        Reason: "custom resource failed",
        RequestId,
        StackId
      };
      await expect(
        sendResponse("http://localhost:3000", response)
      ).resolves.toBeUndefined();
      expect(request).toHaveBeenCalledWith(
        "http://localhost:3000",
        {
          headers: {
            "Content-Length": JSON.stringify(response).length,
            "Content-Type": "application/json"
          },
          method: "PUT"
        },
        expect.any(Function)
      );
      expect(httpsRequestWriteFn).toHaveBeenCalledWith(
        JSON.stringify(response)
      );
      expect(httpsRequestEndFn).toHaveBeenCalledWith();
    });

    test("for error in send response", async () => {
      successfullHttpsResponse = false;

      const response: CloudFormationCustomResourceResponse = {
        Status: "SUCCESS",
        PhysicalResourceId: "phy1",
        Data: { p1: "V1", p2: "V2" },
        NoEcho: true,
        LogicalResourceId,
        Reason: "custom resource failed",
        RequestId,
        StackId
      };
      await expect(
        sendResponse("http://localhost:3000", response)
      ).rejects.toEqual(new Error("https request failed"));
      expect(request).toHaveBeenCalledWith(
        "http://localhost:3000",
        {
          headers: {
            "Content-Length": JSON.stringify(response).length,
            "Content-Type": "application/json"
          },
          method: "PUT"
        },
        expect.any(Function)
      );
    });

    test("for non OK response", async () => {
      httpsResponseStatusCode = 400;
      const response: CloudFormationCustomResourceResponse = {
        Status: "SUCCESS",
        PhysicalResourceId: "phy1",
        Data: { p1: "V1", p2: "V2" },
        NoEcho: true,
        LogicalResourceId,
        RequestId,
        StackId
      };
      await expect(
        sendResponse("http://localhost:3000", response)
      ).rejects.toEqual(new Error("https-mocked-status-message"));
      expect(request).toHaveBeenCalledWith(
        "http://localhost:3000",
        {
          headers: {
            "Content-Length": JSON.stringify(response).length,
            "Content-Type": "application/json"
          },
          method: "PUT"
        },
        expect.any(Function)
      );
    });
  });
});
