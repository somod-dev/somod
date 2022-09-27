```YAML
title: Reuse SOMOD Module
meta:
  description:
    SOMOD framework is designed by keeping reusability at its core.
```

# Reuse SOMOD Module

---

SOMOD framework is designed by keeping reusability at its core.

Add the available modules as npm dependencies to the current module. The SOMOD CLI will take care of discovering and wiring all the installed modules to prepare the AWS SAM project and the NextJs project.

## Example:-

The User Management module that we have created in our [Getting Started / Develop](/getting-started/develop) chapter is available as the [`somod-example-user-management`](https://npmjs.com/package/somod-example-user-management). Let us reuse somod-example-user-management in a new module.

- Initialize an empty somod module

  ```
  npx create-somod --no-files somod-reuse-example
  cd somod-reuse-example
  ```

- Install `somod-example-user-management` as a dependency

  ```
  npm i somod-example-user-management
  ```

- Deploy the current module  
  SOMOD automatically prepares AWS SAM Project for deployment

  ```
  npx somod deploy -v --guided
  ```

- Get the new Endpoint URL
  Run the following command to retrieve the endpoint URL for the newly deployed module

  ```
  npx somod update-params
  ```

- Start a NextJS server
  Run the following command to start the UI server.

  ```
  npx somod serve
  ```

In the above example, we have created a web application without actually writing the code.  
In the [Next Chapter](/getting-started/deploy), let us understand how to deploy the SOMOD modules.
