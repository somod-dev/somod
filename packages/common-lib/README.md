# `@somod/common-lib`

> Common dependencies and helpers for sodaru modules

This package must be installed as dev and peer dependency in slp, njp, somod modules

This package is auto included during bundling of the modules , hence it is safe to use this as dev dependency

Peer dependencies in this packages include the external dependencies to be needed to run the software , aswell as dependencies required to develop the software

## `toBeBundled`

this library introduces a new key (`includeInBaseLayer`) in `package.json` to list the dependencies needed to run the software
