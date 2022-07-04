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

create and build child schemas using `@solib/schema-manager` utility

#### Using package specific schema

- install the package specific schema as dev dependency
- add the `id` of the schema to be used in `package.json`

  ```JSON
  {
    "serverlessSchema":"<id of the schema>"
  }
  ```
