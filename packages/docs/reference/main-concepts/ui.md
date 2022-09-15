```YAML
title: ui directory in SOMOD Module | SOMOD
meta:
  description:
    Create reusable NextJs pages using SOMOD.
```

# SOMOD `ui` Directory

---

The `ui` directory contains the pages and public assets of a [NextJs](https://nextjs.org/) project. NextJs is an all-in-one framework to develop, preview and deploy UI using react. SOMOD adds **reusability** and **sharing** features to NextJs.

```bash

project-root
    |
    +-- node_modules                               --+
    |       +-- module-a                             |
    |               +-- build/                       |
    |                     +--ui/                     | FROM DEPENDENCIES
    |                         +-- pages/             |
    |                         +-- pages-data/        |
    |                         +-- public/            |
    |                         +-- config.json      --+
    |
    |
    +-- build/                                     --+
    |     +-- ui/                                    |
    |          +-- pages/                            | BUILD OUTPUT
    |          +-- pages-data/                       |
    |          +-- public/                           |
    |          +-- config.json                     --+
    |
    +-- ui/                                        --+
    |       +-- pages/                               |
    |       +-- pages-data/                          | SOURCE
    |       +-- public/                              |
    |       +-- config.yaml                        --+
    |
    +-- pages/                                     --+
    +-- public/                                      | PREPARED
    +-- .env                                         |
    +-- next.config.js                             --+

```

`ui` directory has four optional children

- **`pages`**  
  The pages in SOMOD are similar to NextJs's pages. SOMOD pages always have a **`.tsx`** extension.
- **`pages-data`**  
  The pages in NextJs allow the developer to write data fetching and UI components in the same file. But in SOMOD, data fetching is separated under the pages-data directory. A pages-data file must have a corresponding page under the pages directory.
- **`public`**  
  The public directory in SOMOD is similar to NextJs's public directory
- **`config.yaml`**  
  config.yaml defines a set of configurations this module needs. The config.yaml is explained in detail in its dedicated reference [here](/reference/main-concepts/ui/config.yaml).

SOMOD build command compiles typescript in `ui/pages` and `ui/pages-data` to produce javascript and type definitions under `build/ui/pages` and `build/ui/pages-data` respectively.
The build command copies the files in `ui/public` to `build/ui/public`.
`ui/config.yaml` is validated and converted into `build/ui/config.json` during the build.

SOMOD prepare command generates `pages`, `public`, `.env`, and `next.config.js` by combining all dependency modules.
The [namespace](/reference/main-concepts/namespace) helps to resolve the conflicts when there is a page with the same name that exists in more than one dependency module.

> The **`next.config.override.js`** file in the project root overrides the prepared next.config.js. The developer needs to create `next.config.override.js` following the same structure as [NextJs's configuration file](https://nextjs.org/docs/api-reference/next.config.js/introduction). The prepared `next.config.js` includes configuration from `next.config.override.js` if present.  
> **This file can not be shared and only works in the project root of the current module.**

In the [next section](/reference/main-concepts/ui/config.yaml), let's explore the structure of config.yaml.
