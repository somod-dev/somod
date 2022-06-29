import CustomResource from "@solib/lambda-event-cfn-custom-resource";
import { isPlainObject, isString } from "lodash";
import { parameterSpaceCustomResourceType } from "./types";

const customResource = new CustomResource();

const convertInputParam = (
  input: Record<string, unknown>
): Record<string, string> => {
  const params: Record<string, string> = {};
  const queue = [{ chunk: input, path: [] }];
  while (queue.length > 0) {
    const object = queue.shift();
    if (isPlainObject(object.chunk)) {
      Object.keys(object.chunk).forEach(key => {
        queue.push({ chunk: object[key], path: [...object.path, key] });
      });
    } else {
      params[object.path.join(".")] = isString(object.chunk)
        ? object.chunk
        : JSON.stringify(object.chunk);
    }
  }
  return params;
};

customResource.register<{ parameters: string }, Record<string, string>>(
  parameterSpaceCustomResourceType,
  {
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["parameters"],
      properties: { parameters: { type: "string" } }
    },
    create: async cfnResourceParams => {
      return {
        physicalResourceId: "param-space" + Date.now(),
        attributes: convertInputParam(JSON.parse(cfnResourceParams.parameters))
      };
    },
    update: async physicalResourceId => {
      return {
        physicalResourceId,
        attributes: {}
      };
    },
    delete: async physicalResourceId => {
      return {
        physicalResourceId,
        attributes: {}
      };
    },
    triggersReplacement: ["parameters"],
    noEcho: true
  }
);

export default customResource.getHandler();
