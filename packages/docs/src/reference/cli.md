```YAML
title: SOMOD CLI Reference | SOMOD
meta:
  description:
    SOMOD CLI is a toolset to Develop, Build and Reuse Serverless Applications
```

# SOMOD CLI

---

SOMOD CLI is a toolset to Develop, Build and Reuse Serverless Applications. With the command-line interface (CLI) you can work with a SOMOD module using a terminal, or through an automated system, enabling you to build, and prepare deployable applications.

This page contains a complete list of all SOMOD CLI commands available, along with their arguments and options for additional behaviour

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

## Usage

All SOMOD commands needs to be run under a npm package directory.

## Global Options

- `-h` or `--help`  
  Displays a help about the command

- `--version`  
  Displays the version of the SOMOD CLI

- `-v` or `--verbose`  
  Runs the command in verbose mode. In verbose mode command outputs more info to stdout

## Commands

### **`build`**

```
npx somod build
```

Validates the source and generates `build` directory. The directory strcuture is explained in detail [here](/reference/main-concepts/directory-structure).

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

### **`deploy`**

```
npx somod deploy
```

Deploys the AWS SAM project to AWS Cloudformation. Internally calls `build` and `prepare` with --serverless option.  
This command requires that AWS SAM is installed and configured to right AWS Account. Refer the [Getting started with AWS SAM](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-getting-started.html) guide for setting up SAM.

#### Command Options

- `-g` or `--guided`  
  enables guided flag on aws sam cli

### **`start`**

```
npx somod start
```

This command starts the NextJs Server. Internally calls `build` and `prepare` with --ui option.  
Refer the [Next.js CLI](https://nextjs.org/docs/api-reference/cli) guide for NextJs Commands.

#### Command Options

- `-d` or `--dev`  
  starts the [NextJs dev server](https://nextjs.org/docs/api-reference/cli#development), with watch mode

### **`update-params`**

```
npx somod update-params
```

After deploying AWS SAM Project, this command updates the `parameters.json` with the exported parameters.
Read the [SOMOD Serverless template.yaml](/reference/main-concepts/serverless/template.yaml) guide to define the exported parameter.

#### Command Options

- `-s` or `--stack-name`  
  Stack name to update the params from. Reads from samconfig.toml if omitted

In the [Next Chapter](/reference/lifecycle-hooks) let us explore the way of extending the SOMOD through LifeCycle Hooks.
