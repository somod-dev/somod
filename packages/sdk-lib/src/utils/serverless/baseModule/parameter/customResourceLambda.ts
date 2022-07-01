import CustomResource from "@solib/lambda-event-cfn-custom-resource";
import { parameterSpaceCustomResourceType } from "./types";

const customResource = new CustomResource();

/**
 * converts values of type other than string to string using `JSON.stringify`
 *
 * TODO: when the parameters are referenced in SAM Template, the value provided is always string (Need to check this on specific use-cases)
 */
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
        attributes: convertInputParam(
          // The will be extra escaping for " inside parameters string, so replacing `\\"` with `\"`
          JSON.parse(cfnResourceParams.parameters.replaceAll('\\\\"', '\\"'))
        )
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
