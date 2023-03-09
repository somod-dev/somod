import JSONObjectMerge, { MergedWithReport } from "json-object-merge";
import {
  JSONType,
  ResourcePropertySourceNode,
  ServerlessResource,
  ServerlessTemplate
} from "somod-types";
import { keywordExtend, Extend } from "./extend";

type ResourceIdentifier = {
  module: string;
  resource: string;
};

type ResourceExtendNode = {
  resource: ResourceIdentifier;
  from: ResourceExtendNode[];
  to?: ResourceExtendNode;
};

type ServerlessResourceWithPropertySourceMap = {
  resource: ServerlessResource;
  propertySourceMap: ResourcePropertySourceNode;
};

export class ExtendUtil {
  static getResourceMap(templateMap: Record<string, ServerlessTemplate>) {
    const resourceExtendMap = this._generateResourceExtendNodeMap(templateMap);
    const resourceMap = this._generateResourceMap(
      templateMap,
      resourceExtendMap
    );
    return resourceMap;
  }

  private static _generateResourceExtendNodeMap(
    templateMap: Record<string, ServerlessTemplate>
  ) {
    const extendNodeMap: Record<
      string, // module
      Record<
        string, // resource
        ResourceExtendNode
      >
    > = {};

    Object.keys(templateMap).forEach(module => {
      const resources = templateMap[module].Resources;
      Object.keys(resources).forEach(resource => {
        if (extendNodeMap[module] === undefined) {
          extendNodeMap[module] = {};
        }
        if (extendNodeMap[module][resource] === undefined) {
          extendNodeMap[module][resource] = {
            resource: { module, resource },
            from: []
          };
        }

        if (resources[resource][keywordExtend.keyword] !== undefined) {
          const to = resources[resource][
            keywordExtend.keyword
          ] as ResourceIdentifier;

          if (templateMap[to.module]?.Resources[to.resource] === undefined) {
            throw new Error(
              `Extended resource {${to.module}, ${to.resource}} not found. Extended from {${module}, ${resource}}.`
            );
          }

          if (extendNodeMap[to.module] === undefined) {
            extendNodeMap[to.module] = {};
          }
          if (extendNodeMap[to.module][to.resource] === undefined) {
            extendNodeMap[to.module][to.resource] = {
              resource: to,
              from: []
            };
          }

          extendNodeMap[to.module][to.resource].from.push(
            extendNodeMap[module][resource]
          );
          extendNodeMap[module][resource].to =
            extendNodeMap[to.module][to.resource];
        }
      });
    });

    return extendNodeMap;
  }

  private static _generateResourceMap(
    templateMap: Record<string, ServerlessTemplate>,
    resourceExtendMap: Record<string, Record<string, ResourceExtendNode>>
  ): Record<string, Record<string, ServerlessResourceWithPropertySourceMap>> {
    const getExtendNodeOfOriginalResource = (
      module: string,
      resource: string
    ) => {
      while (resourceExtendMap[module][resource].to !== undefined) {
        const _module = resourceExtendMap[module][resource].to.resource.module;
        const _resource =
          resourceExtendMap[module][resource].to.resource.resource;
        module = _module;
        resource = _resource;
      }
      return resourceExtendMap[module][resource];
    };

    const resourceMap: Record<
      string,
      Record<string, ServerlessResourceWithPropertySourceMap>
    > = {};

    Object.keys(templateMap).forEach(module => {
      const template = templateMap[module];
      if (resourceMap[module] === undefined) {
        resourceMap[module] = {};
      }
      Object.keys(template.Resources).forEach(resource => {
        const rootNode = getExtendNodeOfOriginalResource(module, resource);
        const { module: rootModule, resource: rootResource } =
          rootNode.resource;
        if (resourceMap[rootModule]?.[rootResource] === undefined) {
          if (resourceMap[rootModule] === undefined) {
            resourceMap[rootModule] = {};
          }
          resourceMap[rootModule][rootResource] = this._mergeExtendedResource(
            rootNode,
            templateMap
          );
        }
        resourceMap[module][resource] = resourceMap[rootModule][rootResource];
      });
    });

    return resourceMap;
  }

  private static _mergeExtendedResource(
    resourceExtendNode: ResourceExtendNode,
    templateMap: Record<string, ServerlessTemplate>
  ) {
    const { module: rootModule, resource: rootResource } =
      resourceExtendNode.resource;

    const propertySourceMap: ResourcePropertySourceNode = {
      module: rootModule,
      resource: rootResource,
      children: {
        $: {
          module: rootModule,
          resource: rootResource,
          children: {}
        }
      }
    };
    let mergedProperties =
      templateMap[rootModule].Resources[rootResource].Properties;
    const extendTreeNodeQueue = [...resourceExtendNode.from];
    while (extendTreeNodeQueue.length > 0) {
      const currentTreeNode = extendTreeNodeQueue.shift();
      const currentResource =
        templateMap[currentTreeNode.resource.module].Resources[
          currentTreeNode.resource.resource
        ];
      const mergedResult = JSONObjectMerge(
        mergedProperties,
        currentResource.Properties,
        (currentResource[keywordExtend.keyword] as Extend)?.rules,
        true
      ) as MergedWithReport;
      mergedProperties = mergedResult.merged as Record<string, JSONType>;

      mergedResult.report.updatedPaths.forEach(updatedPath => {
        let propertySegmentSourceMapNode = propertySourceMap;
        let property = { $: mergedProperties } as JSONType;
        updatedPath.path.forEach(pathSegment => {
          if (
            propertySegmentSourceMapNode.children[pathSegment] === undefined
          ) {
            propertySegmentSourceMapNode.children[pathSegment] = {
              module: propertySegmentSourceMapNode.module,
              resource: propertySegmentSourceMapNode.resource,
              children: {}
            };
          }
          propertySegmentSourceMapNode =
            propertySegmentSourceMapNode.children[pathSegment];
          property = property[pathSegment];
        });
        switch (updatedPath.operation) {
          case "APPEND":
            {
              const mergedArrayLength = (property as unknown[]).length || 0;
              for (
                let i = mergedArrayLength - updatedPath.count;
                i < mergedArrayLength;
                i++
              ) {
                propertySegmentSourceMapNode.children[i] = {
                  module: currentTreeNode.resource.module,
                  resource: currentTreeNode.resource.resource,
                  children: {}
                };
              }
            }
            break;
          case "PREPEND":
            {
              const prependedCount = updatedPath.count;
              const mergedArrayLength = (property as unknown[]).length || 0;
              for (
                let i = mergedArrayLength - prependedCount - 1;
                i >= 0;
                i--
              ) {
                // move the existing properties right
                if (propertySegmentSourceMapNode.children[i] !== undefined) {
                  propertySegmentSourceMapNode.children[i + prependedCount] =
                    propertySegmentSourceMapNode.children[i];
                  delete propertySegmentSourceMapNode.children[i];
                }
              }
              // prepend
              for (let i = 0; i < prependedCount; i++) {
                propertySegmentSourceMapNode.children[i] = {
                  module: currentTreeNode.resource.module,
                  resource: currentTreeNode.resource.resource,
                  children: {}
                };
              }
            }
            break;
          case "REPLACE":
          case "COMBINE":
            // NOTE: same effect for REPLACE and COMBINE
            // @ts-expect-error propertyModuleMap is not freezed yet, so readonly property `module` can be re-assigned
            propertySegmentSourceMapNode.module =
              currentTreeNode.resource.module;
            // @ts-expect-error propertyModuleMap is not freezed yet, so readonly property `module` can be re-assigned
            propertySegmentSourceMapNode.resource =
              currentTreeNode.resource.resource;
            // @ts-expect-error propertyModuleMap is not freezed yet, so readonly property `children` can be re-assigned
            propertySegmentSourceMapNode.children = {};
            break;
        }
      });

      extendTreeNodeQueue.push(...currentTreeNode.from);
    }

    return {
      resource: {
        ...templateMap[rootModule].Resources[rootResource],
        Properties: mergedProperties
      },
      propertySourceMap: propertySourceMap.children["$"]
    };
  }

  static getResourcePropertySource(
    propertyPath: (string | number)[],
    propertyModuleMap: ResourcePropertySourceNode
  ): { module: string; resource: string; depth: number } {
    const _propertyPath = [...propertyPath];
    if (_propertyPath[0] === "$") {
      _propertyPath.shift();
    }

    let nearestPropertyModuleMap = propertyModuleMap;

    let i = 0;
    for (; i < _propertyPath.length; i++) {
      if (nearestPropertyModuleMap.children[_propertyPath[i]] === undefined) {
        break;
      } else {
        nearestPropertyModuleMap =
          nearestPropertyModuleMap.children[_propertyPath[i]];
      }
    }
    return {
      module: nearestPropertyModuleMap.module,
      resource: nearestPropertyModuleMap.resource,
      depth: i - 1
    };
  }
}
