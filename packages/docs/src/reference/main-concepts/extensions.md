```YAML
title: SOMOD Extensions | SOMOD
meta:
  description:
    Extend SOMOD using extension modules
```

# SOMOD Extensions

---

Extend the working of the SOMOD toolset using the extensions. An Extension is a SOMOD module having an `extension.ts` file at the root of the project.

## Extension file structure

```bash

project-root
    |
    +-- node_modules                         --+
    |       +-- module-a                       |
    |               +-- build/                 | FROM DEPENDENCIES
    |                     +-- extension.js     |
    |                                        --+
    |
    |
    +-- build/                               --+
    |     +-- extension.js                     | BUILD OUTPUT
    |                                        --+
    |
    +-- extension.ts                         --  SOURCE

```

During the build stage, SOMOD compiles `extension.ts` into `build/extension.js`. While preparing, SOMOD loads and applies extensions from all the installed modules.

## Content of Extension

Provide the following named exports from the `extension.ts` file to modify the behavior of the SOMOD tool. _Each named export is optional._

### Hooks

Hooks are the custom functions called during the build and preparation phase.

> Learn more about SOMOD CLI in its dedicated chapter [here](/reference/cli)

- `prebuild`

  ```typescript
  import { IContext } from "somod";
  export const prebuild = async (context: IContext) => {
    // do pre-build actions
  };
  ```

  - prebuild hooks are called _after the validation_ and _before the build_ tasks during the `somod build` command.
  - prebuild hooks are called in the order of module dependency from parent to child. For example, if extension A depends on extension B, prebuild of A is called before prebuild of B.

- `build`

  ```typescript
  import { IContext } from "somod";
  export const build = async (context: IContext) => {
    // do build actions
  };
  ```

  - build hooks are called _after the build_ tasks during the `somod build` command.
  - build hooks are called in the order of module dependency from child to parent. For example, if extension A depends on extension B, the build hook of B is called before the build hook of A.

- `preprepare`

  ```typescript
  import { IContext } from "somod";
  export const preprepare = async (context: IContext) => {
    // do pre-prepare actions
  };
  ```

  - preprepare hooks are called _before the prepare_ tasks during the `somod prepare` command.
  - preprepare hooks are called in the order of module dependency from parent to child. For example, if extension A depends on extension B, preprepare of A is called before preprepare of B.

- `prepare`

  ```typescript
  import { IContext } from "somod";
  export const prepare = async (context: IContext) => {
    // do prepare actions
  };
  ```

  - prepare hooks are called _after the prepare_ tasks during the `somod prepare` command.
  - prepare hooks are called in the order of module dependency from child to parent. For example, if extension A depends on extension B, the prepare hook of B is called before the prepare hook of A.

### Namespaces

Extensions can provide namespaces using `namespaceLoader`

> Learn more about SOMOD Namespace in its dedicated chapter [here](/reference/main-concepts/namespaces)

- `namespaceLoader`

  ```typescript
  import { NamespaceLoader } from "somod";
  export const namespaceLoader: NamespaceLoader = async (module, context) => {
    // return namespaces for the provided module
  };
  ```

### Keywords

Extend the parsing of `ui/config.yaml` and `serverless/template.yaml` using extension keywords.

> Learn more about how SOMOD processes yaml files in its dedicated chapter [here](/reference/main-concepts/yaml-processing)

- `uiConfigKeywords`

  ```typescript
  import { KeywordDefinition } from "somod";
  export const uiConfigKeywords: KeywordDefinition[] = [
    // keywords with validator and processor functions
  ];
  ```

- `uiConfigKeywords`

  ```typescript
  import { KeywordDefinition } from "somod";
  export const serverlessTemplateKeywords: KeywordDefinition[] = [
    // keywords with validator and processor functions
  ];
  ```

### Serverless Functions

Extend the Serverless functions with the following properties from the extension.

> Learn more about SOMOD's serverless features [here](/reference/main-concepts/serverless)

- `functionLayers`

  Defines the layers to be applied to serverless functions from all installed modules

  ```typescript
  export const functionLayers: string[] = [
    // Resource Ids of the layers declared in serverless/template.yaml of this project
  ];
  ```

- `functionMiddlewares`

  Defines the list of middleware to be applied to serverless functions from all installed modules

  ```typescript
  export const functionMiddlewares: string[] = [
    // Resource Ids of the layers declared in serverless/template.yaml of this project
  ];
  ```

Now we have understood the main concepts of SOMOD, let us explore the SOMOD CLI in the [next chapter](/reference/cli)
