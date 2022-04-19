import {
  CloudFormationCustomResourceEvent,
  CloudFormationCustomResourceHandler,
  Context
} from "aws-lambda";
import OriginalCfnLambda from "cfn-lambda";
import { JSONSchema7 } from "json-schema";
import { validate } from "@solib/json-validator";

export type CfnResourceParams = Record<string, unknown>;
type FnGetAttrsDataObj = Record<string, string>;
type PhysicalResourceId = string;

type ReplyCallback = (
  err?: string,
  physicalResourceId?: PhysicalResourceId,
  fnGetAttrsDataObj?: FnGetAttrsDataObj
) => void;

type AsyncResult = Promise<{
  PhysicalResourceId: PhysicalResourceId;
  FnGetAttrsDataObj: FnGetAttrsDataObj;
}>;

export type CreateHandler<T extends CfnResourceParams> = (
  cfnResourceParams: T,
  reply: ReplyCallback
) => void;

export type UpdateHandler<T extends CfnResourceParams> = (
  physicalResourceId: PhysicalResourceId,
  cfnResourceParams: T,
  oldCfnResourceParams: T,
  reply: ReplyCallback
) => void;

export type DeleteHandler<T extends CfnResourceParams> = (
  physicalResourceId: PhysicalResourceId,
  cfnResourceParams: T,
  reply: ReplyCallback
) => void;

export type NoUpdateHandler<T extends CfnResourceParams> = (
  physicalResourceId: PhysicalResourceId,
  cfnResourceParams: T,
  reply: ReplyCallback
) => void;

export type AsyncCreateHandler<T extends CfnResourceParams> = (
  cfnResourceParams: T
) => AsyncResult;

export type AsyncUpdateHandler<T extends CfnResourceParams> = (
  physicalResourceId: PhysicalResourceId,
  cfnResourceParams: T,
  oldCfnResourceParams: T
) => AsyncResult;

export type AsyncDeleteHandler<T extends CfnResourceParams> = (
  physicalResourceId: PhysicalResourceId,
  cfnResourceParams: T
) => AsyncResult;

export type AsyncNoUpdateHandler<T extends CfnResourceParams> = (
  physicalResourceId: PhysicalResourceId,
  cfnResourceParams: T
) => AsyncResult;

export type ValidateHandler<T extends CfnResourceParams> = (
  cfnResourceParams: T
) => string | void;

export type TriggersReplacement<T extends CfnResourceParams> = (keyof T)[];

type CfnLambdaInputCommon<T extends CfnResourceParams> = {
  Validate: ValidateHandler<T>;

  TriggersReplacement?: TriggersReplacement<T>;
};

export type CfnLambdaInputSync<T extends CfnResourceParams> =
  CfnLambdaInputCommon<T> & {
    Create: CreateHandler<T>;
    Update: UpdateHandler<T>;
    Delete: DeleteHandler<T>;
    NoUpdate?: NoUpdateHandler<T>;
  };

export type CfnLambdaInputAsync<T extends CfnResourceParams> =
  CfnLambdaInputCommon<T> & {
    AsyncCreate: AsyncCreateHandler<T>;
    AsyncUpdate: AsyncUpdateHandler<T>;
    AsyncDelete: AsyncDeleteHandler<T>;
    AsyncNoUpdate?: AsyncNoUpdateHandler<T>;
  };

export type CfnLambdaInput<T extends CfnResourceParams> =
  | CfnLambdaInputSync<T>
  | CfnLambdaInputAsync<T>;

export type CfnCustomResourceHandler = (
  event: CloudFormationCustomResourceEvent,
  context: Pick<Context, "invokedFunctionArn">
) => Promise<void>;

const cfnLambda = <T extends CfnResourceParams>(
  resourceDefinition: CfnLambdaInput<T>
): CfnCustomResourceHandler => {
  const handlerFromCfnLambda = OriginalCfnLambda(
    resourceDefinition
  ) as CloudFormationCustomResourceHandler;
  const cloudFormationCustomResourceHandler: CfnCustomResourceHandler = (
    event,
    context
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      handlerFromCfnLambda(
        event,
        {
          // original cfnlambda uses only invokedFunctionArn and done from context
          ...context,
          done: () => {
            // CfnLambda uses legacy api context.done to end the Lamda execution , overriding this with async handler
            // https://docs.aws.amazon.com/lambda/latest/dg/nodejs-handler.html
            resolve();
          }
        } as unknown as Context,
        err => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  };

  return cloudFormationCustomResourceHandler;
};

export default cfnLambda;

export const schemaValidator = <T extends Record<string, unknown>>(
  schema: JSONSchema7
): ValidateHandler<T> => {
  return cfnResourceParams => {
    try {
      validate(schema, cfnResourceParams);
    } catch (e) {
      return e.message;
    }
  };
};
