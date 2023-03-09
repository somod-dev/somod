```YAML
title: ui/config.yaml file in SOMOD Module | SOMOD
meta:
  description:
    Share the UI configuration using SOMOD ui/config.yaml.
```

# SOMOD `ui/config.yaml`

---

A SOMOD module can define a set of configurations in the `config.yaml` file.

The SOMOD build command validates `ui/config.yaml` and generates `/build/ui/config.json`. The SOMOD prepare command combines config.json from all dependency modules to create `.env` and `next.config.js`.

Most of the configuration in `config.yaml` refers to the [SOMOD parameter](/reference/main-concepts/parameters) for their values. The parameter values from `parameters.json` are applied to generate `.env` and `next.config.js` while preparing.

## Anatomy of config.yaml

The `config.yaml` contains four sections. All four sections are optional.

- **`env`**  
  This section defines the environmental variables required by the module. SOMOD generates `.env` from this section.

  ```yaml
  env:
    NEXT_PUBLIC_MY_API_URL:
      # any SOMOD common keywords
      SOMOD::Parameter: mycomponent.api.url
    MY_API_TOKEN:
      SOMOD::If:
        -  # this is true
        -  # use this value
        -  # else this
  ```

  The env is a map of the Environmental variable to the [Common Keywords](/reference/main-concepts/yaml-processing).

- **`imageDomains`**  
  When a module uses an external image, the external domain name needs to be configured in imageDomains. Read more about [image optimization](https://nextjs.org/docs/api-reference/next/image#domains) in NextJs documentation.

  ```yaml
  imageDomains:
    - example.com
    - SOMOD::Parameter: mycomponent.image.cdn
  ```

  The imageDomains is an array of hardcoded domain name strings or [Common Keywords](/reference/main-concepts/yaml-processing).

- **`publicRuntimeConfig`**  
  This section is similar to the [publicRuntimeConfig](https://nextjs.org/docs/api-reference/next.config.js/runtime-configuration) of NextJs configuration. The SOMOD's publicRuntimeConfig refers to the SOMOD parameter for the value.

  ```yaml
  publicRuntimeConfig:
    myTheme:
      # any SOMOD common keywords
      SOMOD::Parameter: mycomponent.api.url
    apiUrl:
      # any SOMOD common keywords
  ```

  The publicRuntimeConfig is a map of the config name to the [Common Keywords](/reference/main-concepts/yaml-processing).

- **`serverRuntimeConfig`**  
  The serverRuntimeConfig is similar to publicRuntimeConfig, but these configs are available only on the server.

  ```yaml
  serverRuntimeConfig:
    apiToken:
      # any SOMOD common keywords
      SOMOD::Parameter: mycomponent.api.url
  ```

  The serverRuntimeConfig is a map of the config name to the [Common Keywords](/reference/main-concepts/yaml-processing).

  In the [Next Chapter](/reference/main-concepts/yaml-processing), let us understand how SOMOD processes `ui/config.yaml` and `serverless/template.yaml` files.
