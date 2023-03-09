```YAML
title: Serverless Middlewares in SOMOD Module | SOMOD
meta:
  description:
    Extend the capability of a lambda function using the SOMOD middleware
```

# Serverless Middlewares

---

Middlewares allows adding a reusable capability to lambda functions at Develop/Prepare time. Create middlewares similar to lambda functions with a resource entry in `serverless/template.yaml` and typescript code at `serverless/functions/middlewares/`. SOMOD defines multiple ways to attach middleware to a lambda function as described in the later sections of this page. During the preparation step, SOMOD bundles the code of the attached middleware and the actual function together. When deployed, the lambda function will have code from multiple middlewares and the original lambda function code.

> This chapter assumes that the reader is well aware of SOMOD's serverless architecture and have knowledge on how to create lambda functions in SOMOD module.  
> Visit [Serverless / Template.yaml](/reference/main-concepts/serverless/template.yaml) and [Serverless / Functions](/reference/main-concepts/serverless/functions) chapters to know more.

## Middleware Callstack

The middlewares are called in the order of their attachment to the function.

```
     (event, content)       (response)
           ||                   /\
 __________||___________________||__________
|          ||     Middleware 1  ||          |
|    ______||___________________||______    |
|   |      ||     Middleware 2  ||      |   |
|   |    __||___________________||__    |   |
|   |   |  ||       Function    ||  |   |   |
|   |   |  \/                   ||  |   |   |
|   |   |     --------------->      |   |   |
|   |   |                           |   |   |
|   |   |                           |   |   |
|   |   |___________________________|   |   |
|   |                                   |   |
|   |___________________________________|   |
|                                           |
|___________________________________________|
```

Each middleware does its job and invokes the next in the sequence and waits for the result. The obtained result can be post-processed before returning to the previous middleware.
Any metadata generated at a middleware can be added to the `event` object so that the same is available for consumption at the middleware and lambda function down the line.

## Middleware Code Syntax

The type definition for the middleware is available from the `somod` package

```typescript
// serverless/functions/middlewares/myMiddleware.ts

import { Middleware } from "somod";

const myMiddleware: Middleware = async (next, event, context) => {
  // use event.somodMiddlewareContext.set(key, value) to set the metadata
  // use event.somodMiddlewareContext.get(key) to set the metadata

  // pre processing

  const result = await next();

  // post processing

  return result;
};

export default myMiddleware;
```

## Middleware Resource Syntax

The middleware is added as a resource of type `SOMOD::Serverless::FunctionMiddleware` in `serverless/template.yaml` similar to a lambda function. The middleware resource is not added to the prepared `template.yaml`, instead its properties are merged into the attached functions.

```yaml
Resources:
  MyMiddleware:
    Type: SOMOD::Serverless::FunctionMiddleware
    Properties:
      CodeUri:
        SOMOD::FunctionMiddleware:
          name: myMiddleware # refers to serverless/functions/middlewares/myMiddleware.ts
          allowedTypes: # when provided, this middleware can only be attached to functions of allowed type
            - functionType1
            - functionType2
      Environment: # Environment variables are merged to the attached function
        Variables:
          MY_ENV1: value1
      Layers: # Layers are merged into the attached function
        - SOMOD::Ref:
            resource: myLayer
```

## Middleware Attachment Strategies

In the previous sections, we have understood how middlewares work and how to create them. Now let us understand how to attach middleware to a function.

### Attach directly during development

Add the resource id of the middleware resource in the `middlewares` property of the `SOMOD::Function` keyword in the function resource.

Example:-

```yaml
Resources:
  MyFunction1:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri:
        SOMOD::Function:
          # ...
          middlewares:
            - resource: MyMiddleware2 # attaches MyMiddleware1 in current module
            - module: AnotherModule # attaches MyMiddleware2 from AnotherModule
              resource: MyMiddleware2
      # ...
```

### Attach by extending the Function resource

Add the resource id of the middleware resource in the `middlewares` property of the `SOMOD::Function` keyword in the **extended** function resource.

Example:-

```yaml
Resources:
  MyFunction1:
    Type: AWS::Serverless::Function
    SOMOD::Extend:
      module: OriginalModule
      resource: OriginalFunction
      rules:
        "$.CodeUri['SOMOD::Function'].middlewares": "APPEND" # Append the middlewares when extending
    Properties:
      CodeUri:
        SOMOD::Function:
          # ...
          middlewares:
            - resource: MyMiddleware2 # attaches MyMiddleware1 in current module to OriginalModule.OriginalFunction
            - module: AnotherModule # attaches MyMiddleware2 from AnotherModule to OriginalModule.OriginalFunction
              resource: MyMiddleware2
      # ...
```

### Attach by using Extension

The above two strategies allow attaching the middleware to selected functions. By using the extension, the middleware can be attached to functions of all/selected types.

> Read more about extensions in the dedicated chapter [here](/reference/main-concepts/extensions)

```typescript
// extension.ts

export const functionMiddlewares = [
  "MyMiddleware1", // MyMiddleware1, MyMiddleware2 are the resource id of the middleware resources in this module
  "MyMiddleware2"
];
```

#### Rules when using the extension

- Middlewares listed in functionMiddlewares must exist in the `serverless/template.yaml` of the current module.
- Middleware resources can be directly declared in the current module or may be extended.
- During the preparation phase, middlewares from all installed extensions are attached to all available functions.
- A middleware can restrict the type of function to attach to by using `allowedTypes` property.

> The extension is very useful to attach the authentication/data-sanity/logging middlewares to all installed functions just by installing the extension.

Now we have fully understood the capabilities of SOMOD to create serverless applications. In the [next chapter](/reference/main-concepts/ui), let us understand how SOMOD helps to create UI in modules.
