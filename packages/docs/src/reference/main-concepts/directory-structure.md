```YAML
title: Directory Structure in SOMOD Module | SOMOD
meta:
  description:
    SOMOD defines the file and directory structure to develop modules. This directory structure is key to the working of the SOMOD module.
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
        |
        +-- serverless/
        |
        +-- parameters.yaml
        |
        +-- tsconfig.somod.json
        |
        +-- package.json
  ```

  Let's explore these individual files and directories in their respective chapters in the upcoming sections.

- The **Build** phase validates the source code and generates a distributable code.  
  The build directory looks like this.

  ```bash
    project-root
        |
        +-- build/
        |     |
        |     +-- lib/
        |     |
        |     +-- ui/
        |     |
        |     +-- serverless/
        |     |
        |     +-- parameters.json
        |
        +-- package.json
  ```

  When `npm` tries to publish the SOMOD module, only the build directory is included in the published package. Read more about npm publish [here](https://docs.npmjs.com/cli/v8/commands/npm-publish)

- The **Prepare** phase combines the code from all dependency modules to generate AWS SAM and NextJs Projects.  
  The generated files look like this.
  ```bash
    project-root
        |
        +-- pages/               --+
        +-- public/                |  PREPARED NEXTJS PROJECT
        +-- .env                   |
        +-- next.config.js       --+
        |
        +-- .somod/              --+
        +-- template.yaml        --+  PREPARED SAM PROJECT
        |
        +-- parameters.json      ---  PARAMETRS USED to PREPARE
  ```
  - `.somod` is the SOMOD working directory, during the prepare phase SOMOD bundles lambda functions and function layers from all modules into this directory.
  - `template.yaml` is the prepared SAM Template.
  - `pages/`, `public/`, `.env`, `next.config.js` are part of prepared NextJs project.
  - `parameters.json` contains values for each parameter and needs to be provided by the user before running the prepare command.

> During development, the files from all these phases may collide in the same working directory. The developer has to take care of adding everything except source to `.gitignore`. [create-somod](https://www.npmjs.com/package/create-somod) command will create the pre-configured working directory to start with SOMOD.

We will be exploring each of these files and directories in upcoming chapters. Let's start with `lib` in the [next section](/reference/main-concepts/lib)
