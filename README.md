# Sodaru Module SDK

> Design Doc : https://docs.google.com/presentation/d/1mxlUuocYzJfEmOmBrdyPbB1hktiQQHzDAReXXLcOCyM

Sodaru Module (somod) enables development and sharing of UI and Serverless Components as npm packages

## Type of modules

- **NJP** - NextJS Modules
- **SLP** - Serverless Modules
- **SOMOD** - NextJS And Serverless Modules

## Package Inforamtion

### [common-lib](./packages/common-lib)

Common Dependencies and Helpers which are part of every NJP, SLP and SOMOD

### [serverless-schema](./packages/serverless-schema)

JSON schema to validate the templates in SLP and SOMOD modules

### [sdk-lib](./packages/sdk-lib)

Library of tasks and utilities for Developing SLP, NJP and SOMOD modules

### [njp](./packages/njp)

CLI tool to init, build and serve NextJs Modules

### [slp](./packages/slp)

CLI tool to init, build and deploy Serverless Modules

### [somod](./packages/somod)

CLI tool combining njp and slp
