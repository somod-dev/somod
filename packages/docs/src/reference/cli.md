```YAML
title: SOMOD CLI Reference | SOMOD
meta:
  description:
    SOMOD CLI is a toolset to Develop, Build and Reuse Serverless Applications
```

# SOMOD CLI

---

SOMOD CLI is a toolset to Develop, Build and Reuse Serverless Applications. With the command-line interface (CLI) you can work with a SOMOD module using a terminal, or through automated scripts, enabling you to build, and prepare deployable applications.

This page contains a complete list of all SOMOD CLI commands available, along with their arguments and options for additional behavior

## Installing the CLI

To download and install SOMOD CLI, run the following command

```
npm install somod --save-dev
```

> To ease the development configuration and somod project initialization, run [`create-somod`](https://www.npmjs.com/package/create-somod) utility
>
> ```
> npx create-somod
> ```
>
> Refer [Getting started / Setup](/getting-started/setup) for more details on using `create-somod`

## Usage

All SOMOD commands need to be run under an npm package directory.

## Global Options

- `-h` or `--help`  
  Displays the command usage instructions

- `--version`  
  Displays the version of the SOMOD CLI

- `-v` or `--verbose`  
  Runs the command in verbose mode. In verbose mode, the command outputs more info to stdout

## Commands

### **`build`**

```
npx somod build
```

Validates the source and generates `build` directory. The directory structure is explained in detail [here](/reference/main-concepts/directory-structure).

#### Command Options

- `--ui`  
  build only ui
- `--serverless`  
  build only serverless

### **`prepare`**

```
npx somod prepare
```

Prepares NextJs and AWS SAM Projects by combining all dependency modules.

#### Command Options

- `--ui`  
  prepare only ui
- `--serverless`  
  prepare only serverless
- `--debug`  
  Enable source-map for deployed lambda functions

### **`deploy`**

```
npx somod deploy
```

Deploys the AWS SAM project to AWS Cloudformation. Internally calls `build` and `prepare` with --serverless option.  
This command requires that AWS SAM is installed and configured to the right AWS Account. Refer to the [Getting started with AWS SAM](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-getting-started.html) guide for setting up SAM.

#### Command Options

- `-g` or `--guided`  
  enables guided flag on AWS SAM CLI

### **`start`**

```
npx somod start
```

This command starts the NextJs Server. Internally calls `build` and `prepare` with the `--ui` option.  
Refer to the [Next.js CLI](https://nextjs.org/docs/api-reference/cli) guide for NextJs Commands.

#### Command Options

- `--dev`  
  starts the [NextJs dev server](https://nextjs.org/docs/api-reference/cli#development), with watch mode

### **`parameters update`**

```
npx somod parameters update
```

After deploying AWS SAM Project, this command updates the `parameters.json` with the exported parameters.  
Refer to the `Outputs` section of [`serverless/template.yaml`](/reference/main-concepts/serverless/template.yaml) to know how to export an output from the Cloudformation stack to a parameter.

#### Command Options

- `-s` or `--stack-name`  
  Stack name to update the params from. Reads from `samconfig.toml` if omitted

### **`parameters validate`**

```
npx somod parameters validate
```

Validates the `parameters.json` file against the parameters schema

#### Command Options

_No command-specific options_
