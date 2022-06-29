import CustomResource from "@solib/lambda-event-cfn-custom-resource";
import { deserialize } from "../../parameter";
import { parameterSpaceCustomResourceType } from "./types";

const customResource = new CustomResource();

const convertInputParam = (
  input: Record<string, unknown>
): Record<string, string> => {
  const params: Record<string, string> = {};
  Object.keys(input).forEach(key => {
    params[key] =
      typeof input[key] == "string"
        ? (input[key] as string)
        : JSON.stringify(input[key]);
  });
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
        attributes: convertInputParam(deserialize(cfnResourceParams.parameters))
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
