import { dfs } from "graph-dsa";
import { merge } from "lodash";
import { getExtendedResourceMap } from "../keywords/extend";
import { SAMTemplate } from "../types";

const sortExtendedMap = (extendedMap: Record<string, string>) => {
  type Node = {
    name: string;
    children: string[];
    parent?: string;
  };

  const nodeMap: Record<string, Node> = {};
  Object.keys(extendedMap).forEach(fromId => {
    const toId = extendedMap[fromId];
    if (!nodeMap[fromId]) {
      nodeMap[fromId] = { name: fromId, children: [] };
    }
    if (!nodeMap[toId]) {
      nodeMap[toId] = { name: toId, children: [] };
    }
    nodeMap[fromId].parent = toId;
    nodeMap[toId].children.push(fromId);
  });

  const sorted = dfs(Object.values(nodeMap));

  return sorted.map(n => n.name).filter(i => !!extendedMap[i]);
};

export const extendResources = (samTemplate: SAMTemplate) => {
  const extendedMap = getExtendedResourceMap(samTemplate);
  const extendedOrder = sortExtendedMap(extendedMap);

  extendedOrder.forEach(fromId => {
    const toId = extendedMap[fromId];
    samTemplate.Resources[toId] = {
      ...samTemplate.Resources[toId],
      Properties: merge(
        samTemplate.Resources[toId].Properties,
        samTemplate.Resources[fromId].Properties
      )
    };
    delete samTemplate.Resources[fromId];
  });
};
