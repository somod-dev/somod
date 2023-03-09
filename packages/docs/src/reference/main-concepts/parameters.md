```YAML
title: Parameters in SOMOD Module | SOMOD
meta:
  description:
    Learn about a unified way to configure Infrastructure, Backend, and Frontend code in the SOMOD module.
```

# Parameters

---

The SOMOD Parameters define the configurations for the module. `ui/config.yaml` and `serverless/template.yaml` refer to the parameters available in the `parameters.yaml`.

`ui/config.yaml` and `serverless/template.yaml` can refer to the parameters from the current and all dependency modules.

When more than one dependency module has the same parameter defined, the conflict is resolved using the [namespaces](/reference/main-concepts/namespaces).

SOMOD build command validates `parameters.yaml` and generates `build/parameters.json`. SOMOD prepare command combines parameters from all dependency modules and updates the missing values in the root parameters.json. The prepare command also generates the NextJs and AWS SAM configuration files from parameters.json in the root.

```bash

project-root
    |
    +-- node_modules                               --+
    |       +-- module-a                             |
    |               +-- build/                       | FROM DEPENDENCIES
    |                     +--parameters.json         |
    |                                              --+
    |
    +-- build/                                     --+
    |      +-- parameters.json                       | BUILD OUTPUT
    |                                              --+
    |
    +-- parameters.yaml                            --- SOURCE
    |
    +-- parameters.json                            --- PREPARED

```

> There are three parameter files in a module.
>
> - The developer creates the `parameters.yaml` in the root directory.
> - SOMOD build command generates the `build/parameters.json` from parameters.yaml.
> - `parameters.json` at the root directory contains a JSON object of parameter names and values. SOMOD prepare command uses the values in `parameters.json` to create `.env`, `next.config.js`, and `template.yaml`.

## Anatomy of parameters.yaml

```yaml
parameters:
  mycomponent.param1: # parameter name
    type: string # parameter schema follows JSON-Schema7 specification
    default: waw
    maxLength: 20
  mycomponent.param2:
    type: email
    default: me@example.com
```

The `parameters.yaml` contains one section, **parameters**

- **`parameters`**  
  parameters is a map of the parameter name to JSON schema.

  - `Parameter name`  
    The parameter name has the following constraints

    - must contain only the alphabet, numbers, and dots
    - can have a maximum of 128 characters.
    - must start with the alphabet
    - and must have at least one dot

  - `Parameter Schema`  
    Must use the [JSON-Schema](https://json-schema.org/) version 7 specification.

> Parameter Name is [namespace](/reference/main-concepts/namespaces)d. Meaning there should be only one occurance of a parameter name in all installed modules.

In the [Next Chapter](/reference/main-concepts/namespaces), let us understand the namespaces in SOMOD.
