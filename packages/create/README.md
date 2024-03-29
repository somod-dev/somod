# create-somod

> [SOMOD](https://somod.dev) project creation utility

Initialize the SOMOD project

## Usage

```bash
npx create-somod
```

### help

```bash
npx create-somod -h
```

```bash
Usage: create-somod [options] [modName]

Arguments:
  modName             module Directory name to create project
                       (default: "my-module")

Options:
  -v, --verbose       enable verbose
  --ui                Initialize only UI
  --serverless        Initialize only Serverless
  --version           somod SDK Version
  --template-version  somod-template Version
  --no-git            Skip git initialization
  --no-prettier       Skip prettier initialization
  --no-eslint         Skip eslint initialization
  --no-files          Skip Sample files
  --npm-prompt        Prompt for input during npm init
  -h, --help          display help for command

```
