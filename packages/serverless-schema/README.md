# Serverless Schema

> JSON Schema for serverless templates

## Install

```
npm i @sodaru/serverless-schema;
```

## Overview

At [sodaru](https://sodaru.com), serverless backend is authered in special npm packages called `slp` or `emp`. These npm packages contains a part of AWS SAM Template which can be shared useing npm

More on design [here](https://docs.google.com/presentation/d/1mxlUuocYzJfEmOmBrdyPbB1hktiQQHzDAReXXLcOCyM#slide=id.gfb6ddf4b5a_0_0)

### Scopes and Schemas

- All `slp` and `emp` packages must adhere to common schema [schemas/index.json](./schemas/index.json)

- Each package can adhere to more specific schema defined for its scope
  - Built-In Scope specific schemas
    - `@sodaru` - [./schemas/sodaru.json](./schemas/sodaru.json)
    - `@somod` - [./schemas/somod.json](./schemas/emp.json)
    - `@socloud` - [./schemas/socloud.json](./schemas/entranse.json)

#### Creating Schemas for Private Scopes

To create a schema specific to a scope , follow these steps

- create a new npm package and add this package (`@somod/serverless-schema`) as _dev_ and _peer_ dependency
- auther the JSON schemas in the root directory of the created package
  - the mata schemas are available at [./meta-schemas](./meta-schemas)
  - **`$id`** of the schema must be of the format  
    `https://json-schema.sodaru.com/`**`[package-name]`**`/`**`[path-to-schema-json]`**  
    _Example:_ a schema file at `/schemas/my-scope.json` in a package named `@private-scope/my-schemas` will have  
    `https://json-schema.sodaru.com/`**`@private-scope/my-schemas`**`/`**`schemas/my-scope.json`**

## Usage

To compile a schema in ajv

```TS
import { compile } from "@somod/serverless-schema";

/**
 * @param dir - is the root directory of the slp or emp package where is schema is used to validate
 * @param ajv - is an Ajv instance
 * @param scopeOrId - is one of the build in scopes '@sodaru', '@emp', '@entranse' OR the '$id' of the scope specific schema
 */
const validate = await compile(dir, ajv, scopeOrId);

```

To use in VS-Code,

add a comment in `template.yaml`

```YAML
# yaml-language-server: $schema=./node_modules/@somod/serverless-schema/schemas/index.json

Description:

Resources:

```
