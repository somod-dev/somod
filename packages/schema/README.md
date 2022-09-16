# JSON Schema in SOMOD

> JSON Schema for `parameters.yaml`, `ui/config.yaml` and `serverless/template.yaml` files in SOMOD

## Install

```
npm i somod-schema;
```

## Usage

SOMOD CLI uses this schema internally to validate the file during build.

Use this package in the custom plugin to extend the default schema to work with more contraints.

```typescript
import { parameters, serverlessTemplate, uiConfig } from "somod-schema";

// parameters, serverlessTemplate, uiConfig are objects of JSONSchema7 type
```

## Support

This project is a part of Open Source Intitiative from [Sodaru Technologies](https://sodaru.com)

Write an email to opensource@sodaru.com for queries on this project
