import { CloudFormationCustomResourceHandler } from "aws-lambda";
import { handleEvent } from "./handleEvent";
import {
  CustomResourceOptions,
  ResourceAttributes,
  ResourceParams
} from "./types";

export default class CustomResource {
  private options: Record<
    string,
    CustomResourceOptions<ResourceParams, ResourceAttributes>
  > = {};

  register<R extends ResourceParams, A extends ResourceAttributes>(
    resourceType: string,
    options: CustomResourceOptions<R, A>
  ) {
    this.options[resourceType] = options as CustomResourceOptions<
      ResourceParams,
      ResourceAttributes
    >;
  }

  getHandler(): CloudFormationCustomResourceHandler {
    return async event => {
      await handleEvent(event, this.options);
    };
  }
}
