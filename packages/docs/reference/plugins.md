```YAML
title: SOMOD Plugins Reference | SOMOD
meta:
  description:
    Extend SOMOD CLI using third-party plugins
```

# SOMOD Plugins

---

SOMOD Plugins allows developers to extend the functionality of SOMOD.

## Use plugin

Install the plugin as an npm package and add the name of the plugin in package.json of the SOMOD module

```json
// package.json
{
  "somodPlugins": ["somod-plugin1", "somod-plugin2"],
  "devDependencies": {
    "somod-plugin1": "^1.0.0",
    "somod-plugin2": "^1.0.0"
  }
}
// somod-plugin1 and somod-plugin2 are for this example only. Use the right plugin in your case
```

## Develop Plugin

SOMOD Plugins provide the extra task to existing SOMOD commands. SOMOD calls the methods provided by the plugin with module information.

The plugin must export a CommonJs module as shown below.

```javascript
module.exports = {
  namespaceLoader: function(){},
  prebuild:function(){},
  // See the section below for the complete list of options
  ...
}
```

Following section describes the allowed members and their type

```typescript
import {
  ModuleHandler,
  NamespaceLoader,
  KeywordDefinition,
  GetNodeRuntimeVersionType,
  GetParameterNameFromSAMOutputNameType,
  GetSAMOutputNameType,
  GetSAMResourceLogicalIdType,
  GetSAMResourceNameType
} from "somod";

export type Mode = { ui: boolean; serverless: boolean };

export type Plugin = {
  namespaceLoader?: NamespaceLoader;
  keywords?: {
    uiConfig?: KeywordDefinition[];
    serverless?: KeywordDefinition[];
  };
  prebuild?: (
    dir: string,
    moduleHandler: ModuleHandler,
    mode: Mode
  ) => Promise<void>;
  build?: (
    dir: string,
    moduleHandler: ModuleHandler,
    mode: Mode
  ) => Promise<void>;
  preprepare?: (
    dir: string,
    moduleHandler: ModuleHandler,
    mode: Mode
  ) => Promise<void>;
  prepare?: (
    dir: string,
    moduleHandler: ModuleHandler,
    mode: Mode,
    serverlessUtils: {
      getNodeRuntimeVersion: GetNodeRuntimeVersionType;
      getSAMResourceLogicalId: GetSAMResourceLogicalIdType;
      getSAMResourceName: GetSAMResourceNameType;
      getSAMOutputName: GetSAMOutputNameType;
      getParameterNameFromSAMOutputName: GetParameterNameFromSAMOutputNameType;
    }
  ) => Promise<void>;
};
```

> The plugin can provide values for any of the these variables.  
> SOMOD invokes the plugin methods in the order specified in the somodPlugins property. Only the **prebuild** and **preprepare** methods are invoked in the reverse order.
