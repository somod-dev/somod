```YAML
title: Parameters in SOMOD Module | SOMOD
meta:
  description:
    Learn about a unified way to configure Infrastructure, Backend, and Frontend code in the SOMOD module.
```

# Parameters

---

The SOMOD Parameters define the configurations for the module. `ui/config.yaml` and `serverless/template.yaml` refer to the parameters available in the parameters.yaml.

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
Parameters:
  mycomponent.param1: # parameter name
    type: text # parameter schema follows the structure of form-input-schema
    default: waw
  mycomponent.param2:
    type: email
    default: me@example.com
Schemas:
  mycomponent.param2.domain.check:
    # valid json schema to be applied on the parameters object
Groups:
  mycomponent:
    label: My Group
    helpText: >
      group helps to combine multiple parameters when 
      a client library tries to display UI 
      to collect data for the parameters
```

The parameters.yaml contains three optional sections, **Parameters**, **Schemas**, and **Groups**

- **`Parameters`**  
  Parameters is a map of the parameter name to the input schema.

  - `Parameter name`  
    The parameter name has the following constraints

    - must contain only the alphabets, numbers, and dots
    - can have a maximum of 128 characters.
    - must start with the alphabet
    - and must have at least one dot

  - `Parameter Input Schema`  
    SOMOD uses [Form Input Schema](https://github.com/sodaru/form-input-schema) to define the validation constraints for the parameters.

- **`Schemas`**  
  Provide additional schema to be applied before using the parameter values during prepare.

  Map of schema name to JSONSchema7. Every Schema from all dependency modules are validated during prepare.

- **`Groups`**  
  Provide Group metadata for the Parameters Grouping.

  All parameters and groups whose name starts with the name of the current group are children of the current group.

> Parameter Name, Schema Name and Group Name are [namespace](/reference/main-concepts/namespaces)d.

In the [Next Chapter](/reference/main-concepts/namespaces), let us understand the namespaces in SOMOD.
