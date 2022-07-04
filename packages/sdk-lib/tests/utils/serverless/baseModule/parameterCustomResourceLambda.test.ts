import { CustomResourceOptions } from "@solib/lambda-event-cfn-custom-resource/dist/types";
import customResourceHandler from "../../../../src/utils/serverless/baseModule/parameter/customResourceLambda";

jest.mock("@solib/lambda-event-cfn-custom-resource", () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => {
      const registered = {};
      return {
        register: jest.fn().mockImplementation((key, value) => {
          registered[key] = value;
        }),
        getHandler: jest.fn().mockReturnValue(() => {
          return registered;
        })
      };
    })
  };
});

describe("test util parameterCustomResourceLambda", () => {
  test("test", async () => {
    const registeredConfig = customResourceHandler() as Record<
      string,
      CustomResourceOptions<{ parameters: string }, Record<string, string>>
    >;
    expect(registeredConfig).toEqual({
      "Custom::ParameterSpace": {
        schema: {
          type: "object",
          additionalProperties: false,
          required: ["parameters"],
          properties: { parameters: { type: "string" } }
        },
        create: expect.any(Function),
        update: expect.any(Function),
        delete: expect.any(Function),
        triggersReplacement: ["parameters"],
        noEcho: true
      }
    });

    const {
      create: createHandler,
      update: updateHandler,
      delete: deleteHandler
    } = registeredConfig["Custom::ParameterSpace"];

    await expect(
      createHandler(
        {
          parameters:
            '{"myvalue":"{\\\\"array\\\\":[\\\\"this is \\\\\\\\n a \'string\'\\\\",123,100.02,false,null],\\\\"object.content\\\\":{\\\\"string\\\\":\\\\"this is a string conatining quotes (\\\\\\\\\\\\")\\\\",\\\\"integer\\\\":123,\\\\"number\\\\":100.02,\\\\"boolean\\\\":false,\\\\"null\\\\":null,\\\\"array\\\\":[\\\\"this is a string\\\\",123,100.02,true,null],\\\\"object\\\\":{}}}"}'
        },
        null
      )
    ).resolves.toEqual({
      physicalResourceId: expect.stringContaining("param-space"),
      attributes: {
        myvalue:
          '{"array":["this is \\\\n a \'string\'",123,100.02,false,null],"object.content":{"string":"this is a string conatining quotes (\\\\")","integer":123,"number":100.02,"boolean":false,"null":null,"array":["this is a string",123,100.02,true,null],"object":{}}}'
      }
    });

    await expect(updateHandler("123", null, null, null)).resolves.toEqual({
      physicalResourceId: "123",
      attributes: {}
    });

    await expect(deleteHandler("123", null, null)).resolves.toEqual({
      physicalResourceId: "123",
      attributes: {}
    });
  });
});
