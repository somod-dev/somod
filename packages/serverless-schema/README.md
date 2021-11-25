# Serverless Schema

> JSON Schema for serverless templates

## Install

```
npm i @somod/serverless-schema;
```

## Overview

At [sodaru](https://sodaru.com), serverless backend is authered in special npm packages called `slp` or `somod`. These npm packages contains a part of AWS SAM Template which can be shared using npm

More on design [here](https://docs.google.com/presentation/d/1mxlUuocYzJfEmOmBrdyPbB1hktiQQHzDAReXXLcOCyM#slide=id.gfb6ddf4b5a_0_0)

### Schemas

- All `slp` and `somod` packages must adhere to common schema [schemas/index.json](./schemas/index.json)

- Each package can adhere to more specific schema

#### Creating Schemas for Specific package

To create a schema specific to a usecase , follow these steps

- create a new npm package and add this package (`@somod/serverless-schema`) as _dev_ and _peer_ dependency
- auther the JSON schemas in the root directory of the created package
  - the mata schemas are available at [./meta-schemas](./meta-schemas)
  - **`$id`** of the schema must be of the format  
    `https://json-schema.sodaru.com/`**`[package-name]`**`/`**`[path-to-schema-json]`**  
    _Example:_ a schema file at `/schemas/my-scope.json` in a package named `@private-scope/my-schemas` will have  
    `https://json-schema.sodaru.com/`**`@private-scope/my-schemas`**`/`**`schemas/my-scope.json`**

#### Building Schemas for Specific Package

The schemas files in package specific schemas project will be referring to other schemas in `node_modules`.  
But when these schemas are installed , the schema files are already under `node_modules`, references to other schemas changes. so building the schemas before `publish` is must to correct these references

```JSON
{
  "scripts":{
    "prepublish": "npx serverless-schema build <dirs...>"
  }
}
```

#### Using package specific schema

- install the package specific schema as dev dependency
- add the `id` of the schema to be used in `package.json`

  ```JSON
  {
    "serverlessSchema":"<id of the schema>"
  }
  ```

## Usage

### To compile a schema in ajv

```TS
import { compile } from "@somod/serverless-schema";

/**
 * @param dir - is the root directory of the slp or emp package where is schema is used to validate
 * @param ajv - is an Ajv instance
 */
const validate = await compile(dir, ajv);

```

### To use in VS-Code,

add a comment in `template.yaml`

```YAML
# yaml-language-server: $schema=./node_modules/@somod/serverless-schema/schemas/index.json

Description:

Resources:

```
