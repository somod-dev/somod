```YAML
title: Setting up SOMOD
meta:
  description:
    Set up SOMOD and start creating Serverless Modules in minutes.

```

# Setting up SOMOD

---

Set up SOMOD and start creating Serverless Modules in minutes.

## Prerequisites

SOMOD is a CLI toolset developed and distributed using NPM (NodeJs Package Manager). Before working with SOMOD, download and install the [NodeJs](https://nodejs.org/en/download/) for your working environment.

## Setup

There are two ways to set up a SOMOD Module project.

1. Use the initialization command.

   ```
   npx create-somod
   ```

   Running this command creates an npm package called `my-module` or the supplied module name with all the necessary configurations.

   The [readme](https://www.npmjs.com/package/create-somod) of create-somod explains the available options for this command

   _OR_

2. Manual setup  
   Otherwise, the SOMOD Module project can be created manually by following these steps.

   - **Init an npm project**  
     Create a project directory and run `npm init` inside it.
   - **Install somod as a dev dependency**  
     To install the latest version of somod, run `npm install somod --save-dev` command
   - **Update package.json**  
     Configure `package.json` as described in SOMOD's [package.json](/reference/main-concepts/package.json) reference
   - **Create tsconfig.somod.json**  
     The source files in a SOMOD are created using typescript. SOMOD requires `tsconfig.somod.json` to be available in the project root to compile typescript to javascript.
     SOMOD's [tsconfig.somod.json](/reference/main-concepts/tsconfig.somod.json) reference provides the details of configuring `tsconfig.somod.json`
   - **Initialize Git**  
     Initialize the git and ignore everything but source files from the project. The [Directory Structure](/reference/main-concepts/directory-structure) guide explains the directories and files used in SOMOD as source files.

## Setup AWS

SOMOD works on the Serverless Platform from AWS. Install AWS SAM CLI and configure it to deploy SOMOD modules into AWS. The [Getting Started](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-getting-started.html) guide helps you to install and configure AWS SAM.

> Configuring AWS is purely _OPTIONAL_. AWS Setup is **required** only if the module being developed contains backend code and needs to be deployed to AWS for development purposes.

In the [next chapter](/getting-started/develop), let us start developing the SOMOD module. Happy coding.
