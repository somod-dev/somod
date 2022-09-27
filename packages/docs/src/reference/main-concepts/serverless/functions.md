```YAML
title: Serverless Functions in SOMOD Module | SOMOD
meta:
  description:
    Develop, build and deploy serverless functions with ease using SOMOD modules.
```

# Serverless Functions

---

The `serverless/functions` directory contains the code for Lambda functions. The developer first creates the lambda resource in `template.yaml`, then adds a typescript file containing code under the functions directory. The lambda resource in `template.yaml` must have a reference to the filename of the corresponding function.

> When AWS invokes the lambda, it passes an event to the handler function and waits for the returned promise to complete. The contents of the event object and response depend on the use of lambda. This [AWS Documentation](https://docs.aws.amazon.com/lambda/latest/dg/lambda-services.html) describes the different ways of invoking the lambda function.  
> The event and response types are available from the [`@types/aws-lambda`](https://www.npmjs.com/package/@types/aws-lambda) package.

Every SOMOD function must have a lambda handler as the default export.
The SOMOD prepare command will generate a javascript bundle capable of running inside nodeJs runtime at the `.somod/serverless/functions/{moduleName}/{functionName}` directory.

The SOMOD excludes the npm packages in the attached layers from the function bundle.

## Layers

The developer can add common libraries used across multiple functions in a custom layer. Refer `SOMOD::Function` and `SOMOD::FunctionLayer` keywords in [template.yaml](/reference/main-concepts/serverless/template.yaml) for syntax.

## Invoking the functions

AWS SAM documentation describes the [event sources](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/sam-property-function-eventsource.html) to configure the invocation of the function.

The lambda function can handle any of the event described in the _event sources_.
SOMOD recommends that each function must handle only one type of event.

For [HttpApi](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/sam-property-function-httpapi.html) and [Api](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/sam-property-function-api.html) event sources SOMOD automatically tries to resolve the conflicting API Routes.
For conflict resolution strategy refer [Namespaces](/reference/main-concepts/namespaces).
