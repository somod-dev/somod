```YAML
title: Directory Structure in SOMOD Module | SOMOD
meta:
  description:
    SOMOD defines the particular file and directory structure to develop modules. This directory structure is key to the working of the SOMOD module.
```

# Directory Structure

---

To understand the structure of a SOMOD module, let's explore the working of SOMOD.

SOMOD works in 3 phases, **Develop**, **Build** and **Prepare**.

- In **Develop** phase, the developer writes the code in the defined structure. SOMOD module contains Infrastructure, Backend, and Frontend code.  
  The directory structure in this phase is

  ```bash
    project-root
        |
        +-- lib/
        |
        +-- ui/
        |    +-- pages/
        |    +-- pages-data/
        |    +-- public/
        |    +-- config.yaml
        |
        +-- serverless/
        |    +-- functions/
        |    +-- template.yaml
        |
        +-- parameters.yaml
        |
        +-- tsconfig.somod.json
        |
        +-- package.json
  ```

  Let's explore these individual files and directories in their respective chapters in the upcoming sections.

- The **Build** phase validates the source code and generates a distributable code.  
  The build directory looks like.

  ```bash
    project-root
        |
        +-- build/
        |     |
        |     +-- lib/
        |     |
        |     +-- ui/
        |     |    +-- pages/
        |     |    +-- pages-data/
        |     |    +-- public/
        |     |    +-- config.json
        |     |
        |     +-- serverless/
        |     |    +-- functions/
        |     |    +-- template.json
        |     |
        |     +-- parameters.json
        |
        +-- package.json
  ```

  When `npm` tries to publish this module, only the build directory is included in the published package. Read more about npm publish [here](https://docs.npmjs.com/cli/v8/commands/npm-publish)

- The **Prepare** phase combines the code from all dependency modules to generate AWS SAM and NextJs Projects.  
  The generated files looks like.
  ```bash
    project-root
        |
        +-- .somod/
        |      +-- serverless/
        |               +-- functions/
        |               +-- functionLayers/
        +-- pages/
        +-- public/
        +-- .env
        +-- next.config.js
        |
        +-- template.yaml
        |
        +-- parameters.json
  ```
  - `.somod` is the SOMOD working directory, during prepare SOMOD bundles functions and functionLayers from all modules in to this directory.
  - `pages/`, `public/`, `.env`, `next.config.js` are part of NextJs. `template.yaml` is part of AWS SAM project.
  - `parameters.json` contains values for each parameter and needs to be provided by the user before running the prepare command.

> During development, the files from all these phases may collide in the same working directory. The developer has to take care of adding everything except source to `.gitignore`. [create-somod](https://www.npmjs.com/package/create-somod) command will create the pre-configured working directory to start with SOMOD.

We will be exploring each of these files and directories in upcoming chapters. Let's start with `lib` in the [next section](/reference/main-concepts/lib)
