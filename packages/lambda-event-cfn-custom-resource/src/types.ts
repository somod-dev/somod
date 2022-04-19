import { JSONSchema7 } from "json-schema";

export type ResourceParams = Record<string, unknown>;
export type ResourceAttributes = Record<string, string>;
export type PhysicalResourceId = string;

export type HandlerResult<A extends ResourceAttributes> = {
  physicalResourceId: PhysicalResourceId;
  attributes: A;
};

export type ResourceContext = {
  stackId: string;
  requestId: string;
  logicalResourceId: string;
  resourceType: string;
};

export type CreateHandler<
  T extends ResourceParams,
  A extends ResourceAttributes
> = (
  cfnResourceParams: T,
  context: ResourceContext
) => Promise<HandlerResult<A>>;

export type UpdateHandler<
  T extends ResourceParams,
  A extends ResourceAttributes
> = (
  physicalResourceId: PhysicalResourceId,
  cfnResourceParams: T,
  oldCfnResourceParams: T,
  context: ResourceContext
) => Promise<HandlerResult<A>>;

export type DeleteHandler<
  T extends ResourceParams,
  A extends ResourceAttributes
> = (
  physicalResourceId: PhysicalResourceId,
  cfnResourceParams: T,
  context: ResourceContext
) => Promise<HandlerResult<A>>;

export type ValidateHandler<T extends ResourceParams> = (
  cfnResourceParams: T
) => Promise<void>;

export type TriggersReplacement<T extends ResourceParams> = (keyof T)[];

export type CustomResourceOptions<
  T extends ResourceParams,
  A extends ResourceAttributes
> = {
  schema: JSONSchema7;
  create: CreateHandler<T, A>;
  update: UpdateHandler<T, A>;
  delete: DeleteHandler<T, A>;
  triggersReplacement?: TriggersReplacement<T>;
  noEcho?: boolean;
  timeout?: number;
};
