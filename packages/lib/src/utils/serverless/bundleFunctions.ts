import { build as esbuild } from "esbuild";
import { mkdir, writeFile } from "fs/promises";
import { unixStylePath } from "nodejs-file-utils";
import { dirname, join, relative } from "path";
import { IContext } from "somod-types";
import {
  file_index_js,
  path_build,
  path_functions,
  path_middlewares,
  path_serverless,
  path_somodWorkingDir
} from "../constants";
import { getDeclaredFunctions } from "./keywords/function";

const createFunctionWithMiddlewares = async (
  context: IContext,
  _function: {
    module: string;
    name: string;
    middlewares: { module: string; name: string }[];
  }
) => {
  const functionLocation = join(
    context.dir,
    path_somodWorkingDir,
    path_serverless,
    path_functions + "-with-" + path_middlewares,
    _function.module,
    _function.name + ".js"
  );

  const getCodeRelativePath = async (module: string, filePath: string[]) => {
    const codeFilePath = join(
      (await context.moduleHandler.getModule(module)).module.packageLocation,
      path_build,
      path_serverless,
      path_functions,
      ...filePath
    );
    const codeRelativeFilePath = unixStylePath(
      relative(dirname(functionLocation), codeFilePath)
    );
    return codeRelativeFilePath;
  };

  const getMiddlewareImportName = (middleware: {
    module: string;
    name: string;
  }) => {
    return context.getModuleHash(middleware.module) + middleware.name;
  };

  const importStatements: string[] = [
    'import { getMiddlewareHandler } from "somod-middleware";',
    `import lambdaFn from "${await getCodeRelativePath(_function.module, [
      _function.name
    ])}";`
  ];

  await Promise.all(
    _function.middlewares.map(async middleware => {
      importStatements.push(
        `import ${getMiddlewareImportName(
          middleware
        )} from "${await getCodeRelativePath(middleware.module, [
          path_middlewares,
          middleware.name
        ])}";`
      );
    })
  );

  const functionCode = `${importStatements.join("\n")}
const handler = getMiddlewareHandler(lambdaFn, [${_function.middlewares
    .map(getMiddlewareImportName)
    .join(", ")}]);
export default handler;
`;

  await mkdir(dirname(functionLocation), { recursive: true });
  await writeFile(functionLocation, functionCode);

  return functionLocation;
};

export const bundleFunctionsOfModule = async (
  moduleName: string,
  context: IContext,
  verbose = false,
  sourcemap = false
): Promise<void> => {
  const declaredFunctions = await getDeclaredFunctions(context, moduleName);

  const bundledFunctionsPath = join(
    context.dir,
    path_somodWorkingDir,
    path_serverless,
    path_functions,
    moduleName
  );

  await Promise.all(
    declaredFunctions.map(async _function => {
      const functionFilePath = await createFunctionWithMiddlewares(
        context,
        _function
      );

      try {
        await esbuild({
          entryPoints: [functionFilePath],
          bundle: true,
          outfile: join(bundledFunctionsPath, _function.name, file_index_js),
          sourcemap: sourcemap ? "inline" : false,
          platform: "node",
          external: _function.exclude,
          minify: true,
          target: ["node" + context.functionNodeRuntimeVersion],
          logLevel: verbose ? "verbose" : "silent"
        });
      } catch (e) {
        throw new Error(
          `bundle function failed for ${_function.name} from ${moduleName} module: ${e.message}`
        );
      }
    })
  );
};

export const bundleFunctions = async (
  context: IContext,
  verbose = false,
  sourcemap = false
) => {
  const moduleNodes = await context.moduleHandler.listModules();
  const templates = await context.serverlessTemplateHandler.listTemplates();
  const templateMap = Object.fromEntries(
    templates.map(t => [t.module, t.template])
  );

  await Promise.all(
    moduleNodes.map(async moduleNode => {
      const moduleName = moduleNode.module.name;
      if (templateMap[moduleName]) {
        await bundleFunctionsOfModule(moduleName, context, verbose, sourcemap);
      }
    })
  );
};
