/* istanbul ignore file */

import { ModuleHandler } from "../../utils/moduleHandler";
import { loadConfigNamespaces } from "../../utils/nextJs/config";
import { loadPageNamespaces } from "../../utils/nextJs/pages";
import { loadPublicAssetNamespaces } from "../../utils/nextJs/publicAssets";
import { loadParameterNamespaces } from "../../utils/parameters/namespace";
import {
  loadApiRouteNamespaces,
  loadOutputNamespaces
} from "../../utils/serverless/namespace";

export const initializeModuleHandler = async (dir: string) => {
  const namespaceLoaders = [
    loadPageNamespaces,
    loadPublicAssetNamespaces,
    loadConfigNamespaces,
    loadApiRouteNamespaces,
    loadParameterNamespaces,
    loadOutputNamespaces
  ];
  ModuleHandler.initialize(dir, namespaceLoaders);
};
