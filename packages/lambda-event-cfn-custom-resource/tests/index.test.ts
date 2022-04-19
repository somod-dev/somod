import cfnLambda from "../src";
import MockHttpServer from "@sodev/mock-http-server";
import { CloudFormationCustomResourceEventCommon } from "aws-lambda";
import { isEqual } from "lodash";

const customResourceEventCommon: CloudFormationCustomResourceEventCommon = {
  StackId: "my-stack",
  RequestId: "request1",
  ResourceType: "AWS::Custom::MyCustomResource",
  ResponseURL: "__server.url__",
  LogicalResourceId: "Resource1",
  ServiceToken: "arn:aws:lambda:ap-south-1:123456789012:function:my-function",
  ResourceProperties: {
    ServiceToken: "arn:aws:lambda:ap-south-1:123456789012:function:my-function"
  }
};

const context = {
  invokedFunctionArn:
    "arn:aws:lambda:ap-south-1:123456789012:function:my-function"
};

describe("Test the cfn-lambda", () => {
  let server: MockHttpServer = null;
  let log = null;

  beforeEach(async () => {
    // eslint-disable-next-line no-console
    log = console.log;
    // eslint-disable-next-line no-console
    console.log = jest.fn();

    server = new MockHttpServer({ enableHttps: true });
    await server.start();
  });

  afterEach(async () => {
    // eslint-disable-next-line no-console
    console.log = log;

    await server.stop();

    server = null;
  });

  // prettier-ignore
  const createUseCases: [
    string,
    boolean,
    string,
    Record<string, string>,
    boolean,
    string,
    string
  ][] = [
    ["all good", true, "resource1", { A: "X" }, true, "SUCCESS", null],
    ["create handler rejects", false, "resource1", { A: "X" }, true, "FAILED", "Creation failed"],
    ["no physicalResourceId", true, undefined, { A: "X" }, true, "SUCCESS", null],
    ["no data", true, "resource1", undefined, true, "SUCCESS", null],
    ["input validation fails", true, "resource1", { A: "X" }, false, "FAILED", "Validation Failed"],
  ];

  test.each(createUseCases)(
    "for Create %s",
    async (
      title,
      resolveCreate,
      physicalResourceId,
      data,
      validInput,
      status,
      reason
    ) => {
      const _create = jest.fn();
      if (resolveCreate) {
        _create.mockResolvedValue({
          PhysicalResourceId: physicalResourceId,
          FnGetAttrsDataObj: data
        });
      } else {
        _create.mockRejectedValue(new Error("Creation failed"));
      }
      const _update = jest.fn();
      const _delete = jest.fn();
      const _validate = jest
        .fn()
        .mockReturnValue(validInput ? undefined : "Validation Failed");

      const handler = cfnLambda({
        AsyncCreate: _create,
        AsyncUpdate: _update,
        AsyncDelete: _delete,
        Validate: _validate
      });

      const mockedEndPoint = await server.put().thenReply(200, "OK");

      await handler(
        {
          ...customResourceEventCommon,
          ResponseURL: server.url,
          RequestType: "Create",
          ResourceProperties: {
            ...customResourceEventCommon.ResourceProperties,
            ...data
          }
        },
        context
      );

      const requests = await mockedEndPoint.getSeenRequests();
      const requestBody = await requests[0].body.getJson();

      const expectedData: Record<string, unknown> = {
        LogicalResourceId: customResourceEventCommon.LogicalResourceId,
        RequestId: customResourceEventCommon.RequestId,
        StackId: customResourceEventCommon.StackId,
        Status: status
      };
      const defaultPhysicalResourceId = `${expectedData.StackId}/${expectedData.LogicalResourceId}/${expectedData.RequestId}`;

      if (status == "SUCCESS") {
        expectedData.Data = data;
        expectedData.PhysicalResourceId =
          physicalResourceId || defaultPhysicalResourceId;
      } else {
        expectedData.Reason = reason;
        expectedData.PhysicalResourceId = defaultPhysicalResourceId;
      }

      expect(requestBody).toEqual(expectedData);
      expect(_validate).toHaveBeenCalledTimes(1);
      expect(_validate).toHaveBeenCalledWith(data || {});
      if (validInput) {
        expect(_create).toHaveBeenCalledTimes(1);
        expect(_create).toHaveBeenCalledWith(data || {});
      } else {
        expect(_create).toHaveBeenCalledTimes(0);
      }
      expect(_update).toHaveBeenCalledTimes(0);
      expect(_delete).toHaveBeenCalledTimes(0);
    }
  );

  // prettier-ignore
  const updateUseCases: [
    string,
    boolean,
    string,
    Record<string, string>,
    Record<string, string>,
    string[],
    boolean,
    string,
    string
  ][] = [
    ["all good", true, "resource1", { A: "X" }, { A: "Y" }, [], true, "SUCCESS", null],
    ["update handler rejects", false, "resource1", { A: "X" }, { A: "Y" }, [], true, "FAILED", "Update failed"],
    ["no physicalResourceId ", true, undefined, { A: "X" }, { A: "Y" }, [], true, "SUCCESS", null],
    ["no data", true, "resource1", undefined, { A: "Y" }, [], true, "SUCCESS", null],
    ["no olddata", true, "resource1", { A: "X" }, undefined, [], true, "SUCCESS", null],
    ["no change in data", true, "resource1", { A: "X" }, { A: "X" }, [], true, "SUCCESS", null],
    ["noUpdate handler rejects", false, "resource1", { A: "X" }, { A: "X" }, [], true, "FAILED", "NoUpdate failed"],
    ["no change in trigger replacements", true, "resource1", { A: "p", B: "q" }, { A: "p", B:"Y" }, ["A"], true, "SUCCESS", null],
    ["change in trigger replacements", true, "resource1", { A: "X", B: "Y" }, { A: "p", B:"Y" }, ["A"], true, "SUCCESS", null],
    ["create handler rejects", false, "resource1", { A: "X", B: "Y" }, { A: "p", B:"Y" }, ["A"], true, "FAILED", "Creation failed"],
    ["invalid input", true, "resource1", { A: "X" }, { A: "Y" }, [], false, "FAILED", "Validation Failed"],
  ];

  test.each(updateUseCases)(
    "for Update %s",
    async (
      title,
      resolveHandler,
      physicalResourceId,
      data,
      oldData,
      triggerReplacement,
      validInput,
      status,
      reason
    ) => {
      const _triggerReplacement =
        !!data &&
        !!oldData &&
        !triggerReplacement.every(k => data[k] == oldData[k]);

      const _create = jest.fn();
      if (resolveHandler) {
        _create.mockResolvedValue({
          PhysicalResourceId: physicalResourceId + "_new",
          FnGetAttrsDataObj: data
        });
      } else {
        _create.mockRejectedValue(new Error("Creation failed"));
      }
      const _update = jest.fn();
      if (resolveHandler) {
        _update.mockResolvedValue({
          PhysicalResourceId: physicalResourceId,
          FnGetAttrsDataObj: data
        });
      } else {
        _update.mockRejectedValue(new Error("Update failed"));
      }
      const _delete = jest.fn();
      const _noUpdate = jest.fn();
      if (resolveHandler) {
        _noUpdate.mockResolvedValue({
          PhysicalResourceId: physicalResourceId,
          FnGetAttrsDataObj: data
        });
      } else {
        _noUpdate.mockRejectedValue(new Error("NoUpdate failed"));
      }
      const _validate = jest
        .fn()
        .mockReturnValue(validInput ? undefined : "Validation Failed");

      const handler = cfnLambda({
        AsyncCreate: _create,
        AsyncUpdate: _update,
        AsyncDelete: _delete,
        Validate: _validate,
        AsyncNoUpdate: _noUpdate,
        TriggersReplacement: triggerReplacement
      });

      const mockedEndPoint = await server.put().thenReply(200, "OK");

      await handler(
        {
          ...customResourceEventCommon,
          ResponseURL: server.url,
          RequestType: "Update",
          ResourceProperties: {
            ...customResourceEventCommon.ResourceProperties,
            ...data
          },
          PhysicalResourceId: physicalResourceId,
          OldResourceProperties: {
            ...oldData
          }
        },
        context
      );

      const requests = await mockedEndPoint.getSeenRequests();
      const requestBody = await requests[0].body.getJson();

      const expectedData: Record<string, unknown> = {
        LogicalResourceId: customResourceEventCommon.LogicalResourceId,
        RequestId: customResourceEventCommon.RequestId,
        StackId: customResourceEventCommon.StackId,
        Status: status
      };
      const defaultPhysicalResourceId = `${expectedData.StackId}/${expectedData.LogicalResourceId}/${expectedData.RequestId}`;
      expectedData.PhysicalResourceId =
        (physicalResourceId || defaultPhysicalResourceId) +
        (_triggerReplacement && status == "SUCCESS" ? "_new" : "");

      if (status == "SUCCESS") {
        expectedData.Data = data || oldData || {};
      } else {
        expectedData.Reason = reason;
      }

      expect(requestBody).toEqual(expectedData);
      expect(_validate).toHaveBeenCalledTimes(1);
      expect(_validate).toHaveBeenCalledWith(data || {});
      if (validInput) {
        if (isEqual(oldData, data)) {
          expect(_update).toHaveBeenCalledTimes(0);
          expect(_noUpdate).toHaveBeenCalledTimes(1);
          expect(_noUpdate).toHaveBeenCalledWith(
            physicalResourceId,
            data || {}
          );
          expect(_create).toHaveBeenCalledTimes(0);
        } else if (_triggerReplacement) {
          expect(_update).toHaveBeenCalledTimes(0);
          expect(_noUpdate).toHaveBeenCalledTimes(0);
          expect(_create).toHaveBeenCalledTimes(1);
          expect(_create).toHaveBeenCalledWith(data || {});
        } else {
          expect(_update).toHaveBeenCalledTimes(1);
          expect(_update).toHaveBeenCalledWith(
            physicalResourceId,
            data || {},
            oldData || {}
          );
          expect(_noUpdate).toHaveBeenCalledTimes(0);
          expect(_create).toHaveBeenCalledTimes(0);
        }
      } else {
        expect(_update).toHaveBeenCalledTimes(0);
        expect(_noUpdate).toHaveBeenCalledTimes(0);
        expect(_create).toHaveBeenCalledTimes(0);
      }
      expect(_delete).toHaveBeenCalledTimes(0);
    }
  );

  // prettier-ignore
  const deleteUseCases: [
    string,
    boolean,
    string,
    Record<string, string>,
    boolean,
    string,
    string
  ][] = [
    ["all good", true, "resource1", { A: "X" }, true, "SUCCESS", null],
    ["delete handler rejects", false, "resource1", { A: "X" }, true, "FAILED", "Deletion failed"],
    ["no physicalResourceId", true, undefined, { A: "X" }, true, "SUCCESS", null],
    ["no data", true, "resource1", undefined, true, "SUCCESS", null],
    ["input validation fails", true, "resource1", { A: "X" }, false, "SUCCESS", null],
  ];

  test.each(deleteUseCases)(
    "for Delete %s",
    async (
      title,
      resolveDelete,
      physicalResourceId,
      data,
      validInput,
      status,
      reason
    ) => {
      const _create = jest.fn();
      const _update = jest.fn();
      const _delete = jest.fn();
      if (resolveDelete) {
        _delete.mockResolvedValue({
          PhysicalResourceId: physicalResourceId,
          FnGetAttrsDataObj: data
        });
      } else {
        _delete.mockRejectedValue(new Error("Deletion failed"));
      }
      const _validate = jest
        .fn()
        .mockReturnValue(validInput ? undefined : "Validation Failed");

      const handler = cfnLambda({
        AsyncCreate: _create,
        AsyncUpdate: _update,
        AsyncDelete: _delete,
        Validate: _validate
      });

      const mockedEndPoint = await server.put().thenReply(200, "OK");

      await handler(
        {
          ...customResourceEventCommon,
          ResponseURL: server.url,
          RequestType: "Delete",
          ResourceProperties: {
            ...customResourceEventCommon.ResourceProperties,
            ...data
          },
          PhysicalResourceId: physicalResourceId
        },
        context
      );

      const requests = await mockedEndPoint.getSeenRequests();
      const requestBody = await requests[0].body.getJson();

      const expectedData: Record<string, unknown> = {
        LogicalResourceId: customResourceEventCommon.LogicalResourceId,
        RequestId: customResourceEventCommon.RequestId,
        StackId: customResourceEventCommon.StackId,
        Status: status
      };
      const defaultPhysicalResourceId = `${expectedData.StackId}/${expectedData.LogicalResourceId}/${expectedData.RequestId}`;

      expectedData.PhysicalResourceId =
        physicalResourceId || defaultPhysicalResourceId;

      if (status == "SUCCESS") {
        if (validInput) {
          expectedData.Data = data;
        }
      } else {
        expectedData.Reason = reason;
      }

      expect(requestBody).toEqual(expectedData);
      expect(_validate).toHaveBeenCalledTimes(1);
      expect(_validate).toHaveBeenCalledWith(data || {});
      if (validInput) {
        expect(_delete).toHaveBeenCalledTimes(1);
        expect(_delete).toHaveBeenCalledWith(physicalResourceId, data || {});
      } else {
        expect(_delete).toHaveBeenCalledTimes(0);
      }
      expect(_update).toHaveBeenCalledTimes(0);
      expect(_create).toHaveBeenCalledTimes(0);
    }
  );
});
