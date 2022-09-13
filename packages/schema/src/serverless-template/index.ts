import { JSONSchema7 } from "decorated-ajv";
import {
  somodAjvCompile,
  somodAnd,
  somodEquals,
  somodFunctions,
  somodIf,
  somodJsonParse,
  somodJsonStringify,
  somodKey,
  somodOr,
  somodParameter
} from "../common/keywords";

import {
  arrayLike,
  booleanLike,
  numberLike,
  samAnd,
  samBase64,
  samBoolean,
  samCidr,
  samEquals,
  samFindInMap,
  samGetAZs,
  samIf,
  samJoin,
  samNot,
  samNumber,
  samOr,
  samRef,
  samSelect,
  samSplit,
  samString,
  samSub,
  stringLike
} from "./components/expression";

import {
  somodAccess,
  somodCreateIf,
  somodDependsOn,
  somodExtend,
  somodModuleName,
  somodModuleNamePattern,
  somodOutput,
  somodRef,
  somodResourceLogicalIdPattern,
  somodResourceName
} from "./components/keywords";

import { allResource } from "./resources/all";
import { customResource } from "./resources/custom";
import { functionEventSource, functionResource } from "./resources/function";
import { functionLayerResource } from "./resources/functionLayer";

const serverless: JSONSchema7 = {
  $schema: "http://json-schema.org/draft-07/schema",
  $id: "https://somod.json-schema.sodaru.com/serverless-template/index.json",
  title: "JSON Schema for Serverless Template in SOMOD",
  definitions: {
    somodAjvCompile,
    somodAnd,
    somodEquals,
    somodFunctions,
    somodIf,
    somodJsonParse,
    somodJsonStringify,
    somodKey,
    somodOr,
    somodParameter,
    arrayLike,
    booleanLike,
    numberLike,
    samAnd,
    samBase64,
    samBoolean,
    samCidr,
    samEquals,
    samFindInMap,
    samGetAZs,
    samIf,
    samJoin,
    samNot,
    samNumber,
    samOr,
    samRef,
    samSelect,
    samSplit,
    samString,
    samSub,
    stringLike,
    somodAccess,
    somodCreateIf,
    somodDependsOn,
    somodExtend,
    somodModuleName,
    somodModuleNamePattern,
    somodOutput,
    somodRef,
    somodResourceLogicalIdPattern,
    somodResourceName,
    allResource,
    customResource,
    functionEventSource,
    functionResource,
    functionLayerResource
  },
  type: "object",
  required: ["Resources"],
  properties: {
    Resources: {
      type: "object",
      additionalProperties: {
        allOf: [
          { $ref: "#/definitions/allResource" },
          {
            if: {
              type: "object",
              properties: {
                Type: { const: "AWS::Serverless::Function" }
              }
            },
            then: { $ref: "#/definitions/functionResource" },
            else: {
              if: {
                type: "object",
                properties: {
                  Type: { const: "AWS::Serverless::LayerVersion" }
                }
              },
              then: { $ref: "#/definitions/functionLayerResource" },
              else: {
                if: {
                  type: "object",
                  properties: {
                    Type: {
                      type: "string",
                      pattern: "^Custom::[A-Z][a-zA-Z0-9]{0,63}$"
                    }
                  }
                },
                then: { $ref: "#/definitions/customResource" },
                else: { type: "object" }
              }
            }
          }
        ]
      },
      propertyNames: { type: "string", pattern: "^[a-zA-Z0-9]{1,64}$" }
    },
    Outputs: {
      type: "object",
      additionalProperties: {
        $ref: "#/definitions/stringLike"
      },
      propertyNames: {
        $ref: "#/definitions/somodParameter/properties/SOMOD::Parameter"
      }
    }
  },
  additionalProperties: false
};

export default serverless;
