import { applyEvent, logEvent, sendResponse } from "../src/customResource";
import { handleEvent } from "../src/handleEvent";
import {
  CloudFormationCustomResourceEvent,
  CloudFormationCustomResourceEventCommon
} from "aws-lambda";
import {
  CustomResourceOptions,
  ResourceAttributes,
  ResourceParams
} from "../src/types";

const mockedApplyEvent = applyEvent as jest.MockedFunction<typeof applyEvent>;

const mockedLogEvent = logEvent as jest.MockedFunction<typeof logEvent>;
const mockedSendResponse = sendResponse as jest.MockedFunction<
  typeof sendResponse
>;

jest.mock("../src/customResource", () => {
  const originalModule = jest.requireActual("../src/customResource");

  return {
    __esModule: true,
    ...originalModule,
    applyEvent: jest.fn(),
    logEvent: jest.fn(),
    sendResponse: jest.fn()
  };
});

describe("Test handleEvent", () => {
  const StackId = "st1";
  const RequestId = "req1";
  const LogicalResourceId = "Logicle1";
  const ServiceToken = "serviceTkn1";
  const ResourceType = "Custom::R1";
  const ResponseURL = "http://localhost";
  const resourceParams = { p1: { value: "v1" }, p2: "v2" };

  // eslint-disable-next-line no-console
  const originalConsoleError = console.error;

  const eventCommon: CloudFormationCustomResourceEventCommon = {
    StackId,
    RequestId,
    LogicalResourceId,
    ResourceProperties: { ServiceToken, ...resourceParams },
    ServiceToken,
    ResourceType,
    ResponseURL
  };

  const options: CustomResourceOptions<ResourceParams, ResourceAttributes> = {
    create: async () => {
      return { attributes: {}, physicalResourceId: "phy1" };
    },
    update: async () => {
      return { attributes: {}, physicalResourceId: "phy1" };
    },
    delete: async () => {
      return { attributes: {}, physicalResourceId: "phy1" };
    },
    schema: { type: "object" },
    triggersReplacement: ["p1"]
  };

  beforeEach(() => {
    mockedLogEvent.mockReset().mockImplementation(jest.fn());
    mockedApplyEvent.mockReset().mockImplementation(jest.fn());
    mockedSendResponse.mockReset().mockImplementation(jest.fn());

    // eslint-disable-next-line no-console
    console.error = jest.fn();
  });

  afterEach(() => {
    // eslint-disable-next-line no-console
    console.error = originalConsoleError;
  });

  test("for all good", async () => {
    const event: CloudFormationCustomResourceEvent = {
      ...eventCommon,
      RequestType: "Create"
    };

    mockedApplyEvent.mockResolvedValue({
      physicalResourceId: "phy1",
      attributes: {}
    });

    await expect(
      handleEvent(event, { [ResourceType]: options })
    ).resolves.toBeUndefined();
    expect(logEvent).toHaveBeenCalledWith(event);
    expect(applyEvent).toHaveBeenCalledWith(
      event,
      options.schema,
      options.create,
      options.update,
      options.delete,
      options.triggersReplacement
    );
    expect(sendResponse).toHaveBeenCalledTimes(1);
    expect(sendResponse).toHaveBeenCalledWith(
      ResponseURL,
      expect.objectContaining({ Status: "SUCCESS" })
    );
  });

  test("for applyEvent to timeOut", async () => {
    const event: CloudFormationCustomResourceEvent = {
      ...eventCommon,
      RequestType: "Create"
    };

    mockedApplyEvent.mockImplementation(() => {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({ physicalResourceId: "phy1", attributes: {} });
        }, 500);
      });
    });

    await expect(
      handleEvent(event, { [ResourceType]: { ...options, timeout: 200 } })
    ).resolves.toBeUndefined();
    expect(logEvent).toHaveBeenCalledWith(event);
    expect(applyEvent).toHaveBeenCalledWith(
      event,
      options.schema,
      options.create,
      options.update,
      options.delete,
      options.triggersReplacement
    );
    // eslint-disable-next-line no-console
    expect(console.error).toHaveBeenCalledWith(
      new Error(
        "Promise is failed to complete within in timeout of 200 milliseconds"
      )
    );
    expect(sendResponse).toHaveBeenCalledTimes(1);
    expect(sendResponse).toHaveBeenCalledWith(
      ResponseURL,
      expect.objectContaining({
        Status: "FAILED",
        Reason:
          "Promise is failed to complete within in timeout of 200 milliseconds"
      })
    );
  });

  test("for applyEvent to fail", async () => {
    const event: CloudFormationCustomResourceEvent = {
      ...eventCommon,
      RequestType: "Create"
    };

    mockedApplyEvent.mockRejectedValue(new Error("apply failed"));

    await expect(
      handleEvent(event, { [ResourceType]: { ...options, timeout: 200 } })
    ).resolves.toBeUndefined();
    expect(logEvent).toHaveBeenCalledWith(event);
    expect(applyEvent).toHaveBeenCalledWith(
      event,
      options.schema,
      options.create,
      options.update,
      options.delete,
      options.triggersReplacement
    );
    // eslint-disable-next-line no-console
    expect(console.error).toHaveBeenCalledWith(new Error("apply failed"));
    expect(sendResponse).toHaveBeenCalledTimes(1);
    expect(sendResponse).toHaveBeenCalledWith(
      ResponseURL,
      expect.objectContaining({ Status: "FAILED", Reason: "apply failed" })
    );
  });

  test("for send response to fail", async () => {
    const event: CloudFormationCustomResourceEvent = {
      ...eventCommon,
      RequestType: "Create"
    };

    mockedApplyEvent.mockResolvedValue({
      physicalResourceId: "phy1",
      attributes: {}
    });

    mockedSendResponse.mockRejectedValue(new Error("send response failed"));

    await expect(
      handleEvent(event, { [ResourceType]: options })
    ).rejects.toEqual(new Error("send response failed"));
    expect(logEvent).toHaveBeenCalledWith(event);
    expect(applyEvent).toHaveBeenCalledWith(
      event,
      options.schema,
      options.create,
      options.update,
      options.delete,
      options.triggersReplacement
    );
    expect(sendResponse).toHaveBeenCalledTimes(1);
    expect(sendResponse).toHaveBeenCalledWith(
      ResponseURL,
      expect.objectContaining({ Status: "SUCCESS" })
    );
  });

  test("for not configured resource type", async () => {
    const event: CloudFormationCustomResourceEvent = {
      ...eventCommon,
      RequestType: "Create"
    };

    await expect(
      handleEvent(event, { "Custom::MyCustomResource": options })
    ).resolves.toBeUndefined();
    expect(logEvent).toHaveBeenCalledWith(event);
    expect(applyEvent).not.toHaveBeenCalled();
    expect(sendResponse).toHaveBeenCalledTimes(1);
    expect(sendResponse).toHaveBeenCalledWith(
      ResponseURL,
      expect.objectContaining({
        Status: "FAILED",
        Reason: "No Resource Options for Custom::R1"
      })
    );
  });
});
