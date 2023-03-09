```YAML
title: Typescript Configuration in SOMOD Module | SOMOD
meta:
  description:
    SOMOD's typescript configuration helps to compile the source code into the distributable format.
```

# Typescript Configuration in SOMOD Module

---

SOMOD's typescript configuration helps to compile the source code into the distributable format.

SOMOD uses a predefined set of typescript definitions in the `tsconfig.somod.json` file.

The content of the `tsconfig.somod.json` file is as follows

```json
{
  "compilerOptions": {
    "allowUmdGlobalAccess": true,
    "outDir": "build",
    "declaration": true,
    "target": "ES5",
    "module": "ESNext",
    "rootDir": "./",
    "moduleResolution": "Node",
    "esModuleInterop": true,
    "importHelpers": true,
    "skipLibCheck": true,
    "jsx": "react-jsx"
  },
  "include": ["lib", "serverless", "ui"]
}
```

Any extra configurations are allowed, but these configurations must be present and not altered.

Till now this guide explained the main concepts and project structure in the SOMOD module. In the [next chapter](/reference/main-concepts/extensions), let us understand how to extend the capabilities of SOMOD using extensions.
