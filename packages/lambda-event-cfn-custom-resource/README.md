# Cfn Lambda

Improved [cfn-lambda](https://github.com/andrew-templeton/cfn-lambda)

## Overview

improves cfn-lambda and adds typings to cfn lambda

## Install

```
npm i @solib/cfn-lambda
```

## Usage

```TS
import cfnLambda, { CfnLambdaInput } from "@solib/cfn-lambda";

const params : CfnLambdaInput = {
  // fill here
}
const customResource = cfnLambda(params);

export default customResource;

```
