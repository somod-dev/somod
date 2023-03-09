```YAML
title: serverless directory in SOMOD Module | SOMOD
meta:
  description:
    Define serverless infrastructure and code in a simple format using the SOMOD module's serverless directory.
```

# SOMOD's `serverless` Directory

---

The `serverless` directory in the SOMOD module contains infrastructure in the `template.yaml` file and lambda functions code in the `functions` directory.

The `serverless/template.yaml` is optional and has a similar format to AWS SAM Template with some improvements. You can find the `template.yaml`'s specification in its dedicated chapter [here](/reference/main-concepts/serverless/template.yaml).

The `serverless/functions/` directory contains the code for the lambda functions. The build command compiles typescript and generates javascript in ESM module format under `build/serverless/functions/`. The prepare command bundles javascript in ESM format into a CommonJS javascript file under `.somod/serverless/functions/{moduleName}/{functionName}`. Read more about functions [here](/reference/main-concepts/serverless/template.yaml).

```bash

project-root
    |
    +-- node_modules                                              --+
    |       +-- module-a                                            |
    |               +-- build/                                      |
    |                    +-- serverless/                            | FROM DEPENDENCIES
    |                            +-- functions/                     |
    |                            +-- functionLayers/                |
    |                            +-- template.json                --+
    |
    +-- .somod/                                                   --+
    |     +-- serverless/                                           |
    |             +-- functions/{moduleName}/{functionName}/        | BUNDLED
    |             +-- functionLayers/{moduleName}/{functionName}/ --+
    |
    +-- build/                                                    --+
    |     +-- serverless/                                           |
    |             +-- functions/                                    | BUILD OUTPUT
    |             +-- functionLayers/                               |
    |             +-- template.json                               --+
    |
    +-- serverless/                                               --+
    |       +-- functions/                                          | SOURCE
    |       +-- template.yaml                                     --+
    |
    +-- template.yaml                                             --- PREPARED

```

In the [next chapter](/reference/main-concepts/serverless/template.yaml), let us understand the anatomy of SOMOD's template.yaml file.
