import {
  parse,
  AST_NODE_TYPES,
  TSESTree
} from "@typescript-eslint/typescript-estree";

import { readFileSync } from "fs";

export type Exports = {
  default: boolean;
  named: string[];
};

const getExportsFromExportDeclaration = (
  declaration: TSESTree.ExportDeclaration
): string[] => {
  const exports = [];
  switch (declaration.type) {
    case AST_NODE_TYPES.ClassDeclaration:
      exports.push((declaration as TSESTree.ClassDeclaration).id.name);
      break;
    case AST_NODE_TYPES.ClassExpression:
      exports.push((declaration as TSESTree.ClassExpression).id.name);
      break;
    case AST_NODE_TYPES.FunctionDeclaration:
      exports.push((declaration as TSESTree.FunctionDeclaration).id.name);
      break;
    case AST_NODE_TYPES.TSTypeAliasDeclaration:
      exports.push((declaration as TSESTree.TSTypeAliasDeclaration).id.name);
      break;
    case AST_NODE_TYPES.TSDeclareFunction:
      exports.push((declaration as TSESTree.TSDeclareFunction).id.name);
      break;
    case AST_NODE_TYPES.TSEnumDeclaration:
      exports.push((declaration as TSESTree.TSEnumDeclaration).id.name);
      break;
    case AST_NODE_TYPES.TSInterfaceDeclaration:
      exports.push((declaration as TSESTree.TSInterfaceDeclaration).id.name);
      break;
    case AST_NODE_TYPES.VariableDeclaration:
      (declaration as TSESTree.VariableDeclaration).declarations.forEach(
        decl => {
          exports.push((decl.id as TSESTree.Identifier).name);
        }
      );
      break;
    case AST_NODE_TYPES.TSModuleDeclaration:
      {
        const id = (declaration as TSESTree.TSModuleDeclaration)
          .id as TSESTree.Identifier;
        exports.push(id.name);
      }
      break;
    default:
      throw new Error("Invalid Declaration type");
  }
  return exports;
};

const getExportsFromStatement = (
  statement: TSESTree.ProgramStatement
): Exports => {
  const exports: Exports = { default: false, named: [] };
  if (statement.type == AST_NODE_TYPES.ExportNamedDeclaration) {
    if (statement.declaration) {
      exports.named.push(
        ...getExportsFromExportDeclaration(statement.declaration)
      );
    }
    if (statement.specifiers) {
      exports.named.push(
        ...statement.specifiers.map(specifier => specifier.exported.name)
      );
    }
  } else if (statement.type == AST_NODE_TYPES.ExportDefaultDeclaration) {
    exports.default = true;
  } else if (statement.type == AST_NODE_TYPES.ExportAllDeclaration) {
    throw new Error(`export * is not allowed`);
  } else if (statement.type == AST_NODE_TYPES.TSExportAssignment) {
    throw new Error(`export assignment is not allowed`);
  } else if (statement.type == AST_NODE_TYPES.TSNamespaceExportDeclaration) {
    throw new Error(`export namespace is not allowed`);
  }
  return exports;
};

export const get = (file: string): Exports => {
  const fileContent = readFileSync(file, { encoding: "utf8" });
  const ast = parse(fileContent, { jsx: true });
  const exports: Exports = { default: false, named: [] };
  try {
    ast?.body.forEach(statement => {
      const statementExports = getExportsFromStatement(statement);
      exports.default = exports.default || statementExports.default;
      exports.named.push(...statementExports.named);
    });
  } catch (e) {
    throw new Error(e.message + " in " + file);
  }
  return exports;
};

export const generateExportStatement = (
  file: string,
  prefix: string,
  exports: Exports
): string => {
  const _exports: string[] = [];
  if (exports.default) {
    _exports.push(`default as ${prefix}`);
  }
  exports.named.forEach(exportName => {
    _exports.push(`${exportName} as ${prefix}${exportName}`);
  });
  return `export { ${_exports.join(", ")} } from "${file}";`;
};
