import { validate } from "@solib/json-validator";
import {
  CloudFormationCustomResourceEvent,
  CloudFormationCustomResourceResponse,
  CloudFormationCustomResourceResponseCommon,
  CloudFormationCustomResourceUpdateEvent
} from "aws-lambda";
import { JSONSchema7 } from "json-schema";
import { cloneDeep, isEqual, isString } from "lodash";
import { request } from "https";
import {
  ResourceParams,
  CreateHandler,
  DeleteHandler,
  HandlerResult,
  UpdateHandler,
  ResourceAttributes,
  ResourceContext
} from "./types";

export const timedPromise = <T>(
  promise: Promise<T>,
  timeout: number
): Promise<T> => {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(
        new Error(
          "Promise is failed to complete within in timeout of " +
            timeout +
            " milliseconds"
        )
      );
    }, timeout);
    promise.then(
      args => {
        resolve(args);
        clearTimeout(timeoutId);
      },
      e => {
        reject(e);
        clearTimeout(timeoutId);
      }
    );
  });
};

export const logEvent = (event: CloudFormationCustomResourceEvent): void => {
  const eventClone = { ...event };
  delete eventClone.ResourceProperties;
  delete (eventClone as CloudFormationCustomResourceUpdateEvent)
    .OldResourceProperties;

  // eslint-disable-next-line no-console
  console.log(eventClone);
};

export const createResponse = <A extends ResourceAttributes>(
  event: {
    StackId: string;
    RequestId: string;
    LogicalResourceId: string;
    PhysicalResourceId?: string;
  },
  result: HandlerResult<A> | string,
  noEcho: boolean
): CloudFormationCustomResourceResponse => {
  const { StackId, RequestId, LogicalResourceId } = event;
  const PhysicalResourceId =
    (result as HandlerResult<A>).physicalResourceId ||
    event.PhysicalResourceId ||
    `${StackId}/${LogicalResourceId}/${RequestId}`;

  const responseCommon: CloudFormationCustomResourceResponseCommon = {
    PhysicalResourceId,
    StackId,
    RequestId,
    LogicalResourceId
  };

  const response: CloudFormationCustomResourceResponse = {
    ...responseCommon,
    ...(isString(result)
      ? { Status: "FAILED", Reason: result }
      : { Status: "SUCCESS", NoEcho: noEcho, Data: result.attributes })
  };

  return response;
};

export const sendResponse = (
  responseUrl: string,
  response: CloudFormationCustomResourceResponse
): Promise<void> => {
  const responseBody = JSON.stringify(response);
  return new Promise((resolve, reject) => {
    const req = request(
      responseUrl,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": responseBody.length
        }
      },
      res => {
        if (res.statusCode != 200) {
          reject(new Error(res.statusMessage));
        } else {
          res.on("data", () => {
            // don't do anything
          });
          res.on("end", () => {
            resolve();
          });
        }
      }
    );
    req.on("error", e => {
      reject(e);
    });
    req.write(responseBody);
    req.end();
  });
};

export const applyEvent = async <
  T extends ResourceParams,
  A extends ResourceAttributes
>(
  event: CloudFormationCustomResourceEvent,
  schema: JSONSchema7,
  createHandler: CreateHandler<T, A>,
  updateHandler: UpdateHandler<T, A>,
  deleteHandler: DeleteHandler<T, A>,
  triggerReplacement: string[]
): Promise<HandlerResult<A>> => {
  let handlerPromise: Promise<HandlerResult<A>> = null;

  const params = cloneDeep(event.ResourceProperties) as unknown as T;
  delete params.ServiceToken;
  validate(schema, params);

  const resourceContext: ResourceContext = {
    stackId: event.StackId,
    requestId: event.RequestId,
    logicalResourceId: event.LogicalResourceId,
    resourceType: event.ResourceType
  };

  if (event.RequestType == "Create") {
    handlerPromise = createHandler(params, resourceContext);
  } else if (event.RequestType == "Update") {
    let replace = false;
    const oldParams = cloneDeep(event.OldResourceProperties) as unknown as T;

    for (const param of triggerReplacement) {
      if (!isEqual(params[param], oldParams[param])) {
        replace = true;
        break;
      }
    }
    if (replace) {
      handlerPromise = createHandler(params, resourceContext);
    } else {
      handlerPromise = updateHandler(
        event.PhysicalResourceId,
        params,
        oldParams,
        resourceContext
      );
    }
  } else if (event.RequestType == "Delete") {
    handlerPromise = deleteHandler(
      event.PhysicalResourceId,
      params,
      resourceContext
    );
  }

  return await handlerPromise;
};
