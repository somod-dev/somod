import { CloudFormationCustomResourceEvent } from "aws-lambda";
import {
  applyEvent,
  createResponse,
  logEvent,
  sendResponse,
  timedPromise
} from "./customResource";
import {
  CustomResourceOptions,
  HandlerResult,
  ResourceAttributes,
  ResourceParams
} from "./types";

export const handleEventForResource = async <
  T extends ResourceParams,
  A extends ResourceAttributes
>(
  event: CloudFormationCustomResourceEvent,
  options: CustomResourceOptions<T, A>
): Promise<void> => {
  let result: HandlerResult<A> | string;
  try {
    const promise = applyEvent(
      event,
      options.schema,
      options.create,
      options.update,
      options.delete,
      (options.triggersReplacement || []) as string[]
    );
    result = await timedPromise(promise, options.timeout || 2500);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    result = e.message;
  }

  const response = createResponse(event, result, !!options.noEcho);
  await sendResponse(event.ResponseURL, response);
};

export const handleEvent = async <
  T extends ResourceParams,
  A extends ResourceAttributes
>(
  event: CloudFormationCustomResourceEvent,
  options: Record<string, CustomResourceOptions<T, A>>
) => {
  logEvent(event);
  const resourceType = event.ResourceType;
  if (options[resourceType] === undefined) {
    const response = createResponse(
      event,
      `No Resource Options for ${resourceType}`,
      !!options.noEcho
    );
    await sendResponse(event.ResponseURL, response);
  } else {
    await handleEventForResource(event, options[resourceType]);
  }
};
