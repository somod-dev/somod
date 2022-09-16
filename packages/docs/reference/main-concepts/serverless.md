```YAML
title: serverless directory in SOMOD Module | SOMOD
meta:
  description:
    Define serverless infrastructure and code in a simple format using the SOMOD module's serverless directory.
```

# SOMOD `serverless` Directory

---

The serverless directory in the SOMOD module contains infrastructure in the `template.yaml` file and backend code in the `functions` directory.

The `template.yaml` is optional and has a similar format to AWS SAM Template with some improvements. You can find the template.yaml's specification in its dedicated chapter [here](/reference/main-concepts/serverless/template.yaml).

The `functions` directory contains the code for the lambda functions. The prepare command bundles typescript code into a javascript file under `.somod/serverless/functions/{moduleName}/{functionName}`. Read more about functions [here](/reference/main-concepts/serverless/template.yaml).

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
