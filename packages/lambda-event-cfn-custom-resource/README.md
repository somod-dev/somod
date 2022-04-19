# CFN Custom Resource

Wrapper to Handle Cloud Formation [`Custom Resources`](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/template-custom-resources.html) in Lambda Function's code

## Install

```
npm i @solib/cfn-custom-resource
```

## Usage

```typescript
import CustomResource from "@solib/cfn-custom-resource";

const customResource = new CustomResource();

// register as many options for as many resource types
customResource.register("Custom::MyResource", {
  schema: {}, // JSONSchema7;
  create: createHandler, // CreateHandler<T, A>;
  update: updateHandler, // UpdateHandler<T, A>;
  delete: deleteHandler, // DeleteHandler<T, A>;
  triggersReplacement: [], // TriggersReplacement<T>;
  noEcho: true, // boolean;
  timeout: 100 // number;
});

export default customResource.getHandler();
```
