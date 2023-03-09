```YAML
title: YAML processing in SOMOD Module | SOMOD
meta:
  description:
    How SOMOD processes ui/config.yaml and serverless/template.yaml files to prepare SAM "template.yaml" and NextJs configuration.
```

# YAML Processing in SOMOD

---

SOMOD modules define the module infrastructure and other configurations in yaml files. SOMOD validates these files during the build and combines them during the preparation phase.

> YAML processing is applied for `ui/config.yaml` and `serverless/template.yaml`

## The YAML Processor

To start with,  
YAML Processor takes **keywords** and corresponding _validate_ and _process_ functions for each keyword as input.
Then parses the given YAML file from bottom to top, invoking the validate or process function for each matched keyword.

**Example:-**
For the following YAML file,

```yaml
Root:
  A:
    - B: v1
    - B: value2
```

Assuming `A` & `B` are the keywords.  
During validation, the validation function of the keyword `B` is called before that of `A`.

During processing, the process function of the keyword `B` is called before that of `A`. The return value from a process function replaces the keyword in the yaml file, resulting in the chained replacements and producing a new YAML file.

If `A` returns the sum of the numbers and `B` returns the length of the string.
Then the resulting YAML is

```yaml
Root: 8
# length of "v1" = 2,
# length of "value2" = 6,
# 2 + 6 = 8
```

## Processing of `ui/config.yaml` and `serverless/template.yaml`

SOMOD uses above mentioned YAML processing technique to validate and process `ui/config.yaml` and `serverless/template.yaml` files.

During the build, SOMOD validates yaml files from the current module. But during preparation, SOMOD processes the files from each dependency module and merges them to generate the output files.

### Common Keywords

SOMOD defines the following keywords, applicable for both `ui/config.yaml` and `serverless/template.yaml` files. The file-specific keywords are explained on their respective reference pages.

- **SOMOD::AjvCompile**
  This keyword compiles the provided JSON Schema into AJV compiled file content.

  ```yaml
  SOMOD::AjvCompile: # Valid JSON Schema or any of the common keywords resulting in a JSON Schema
  ```

- **SOMOD::And**

  ```yaml
  SOMOD::And:
    -  # Valid Boolean Value or any of the common keywords resulting in a Boolean value
    -  # Valid Boolean Value or any of the common keywords resulting in a Boolean value
    -  # and so on ...
  ```

  This keyword applies "AND" logical operation on provided values and returns the resulting boolean value.

- **SOMOD::Or**

  ```yaml
  SOMOD::Or:
    -  # Valid Boolean Value or any of the common keywords resulting in a Boolean value
    -  # Valid Boolean Value or any of the common keywords resulting in a Boolean value
    -  # and so on ...
  ```

  This keyword applies "OR" logical operation on provided values and returns the resulting boolean value.

- **SOMOD::Equals**

  ```yaml
  SOMOD::Equals:
    -  # a valid value or any of the common keywords
    -  # a valid value or any of the common keywords
  ```

  This keyword applies the "Equality" operation on provided values and returns the resulting boolean value.

- **SOMOD::If**

  ```yaml
  SOMOD::If:
    -  # Valid Boolean Value or any of the common keywords resulting in a Boolean value
    -  # a valid value or any of the common keywords
    -  # a valid value or any of the common keywords
  ```

  This keyword returns the 2nd value in the provided array if the 1st value is truthy otherwise returns the 3rd value.

- **SOMOD::JsonParse**

  ```yaml
  SOMOD::JsonParse: # Valid JSON encoded string or any of the common keywords resulting in a JSON encoded string
  ```

  This keyword returns the parsed JSON object of the provided string.

- **SOMOD::JsonStringify**

  ```yaml
  SOMOD::JsonStringify: # Valid JSON value or any of the common keywords resulting in a JSON value
  ```

  This keyword returns the stringified value of the provided JSON object.

- **SOMOD::Key**

  ```yaml
  SOMOD::Key:
    -  # Valid Object/Array value or any of the common keywords resulting in a Object/Array
    -  # Valid string/number value or any of the common keywords resulting in a string/number
  ```

  This keyword returns the value at the provided key.
  The first parameter is the object or array to look for. The second parameter is the property or index to get the value of.

- **SOMOD::Parameter**

  ```yaml
  SOMOD::Parameter: # name of the somod parameter, the parameter must be defined in parameters.yaml
  ```

  This keyword returns the value of provided [SOMOD parameter](/reference/main-concepts/parameters).

  > During prepare command, SOMOD reads values from `parameters.json` and passes the values to the process function of this keyword. Hence user has to make sure that all necessary values are present in `parameters.json` before running the prepare command.

In our [Next Chapter](/reference/main-concepts/parameters), let us understand how to define parameters in the SOMOD module.
