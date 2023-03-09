/* eslint-disable */

/**
 * NOTE: generateNextConfig task has hardcoded path of this file,
 * Be careful when renaming or moving this file
 */

const { existsSync } = require("fs");
const { join } = require("path");
const overrideConfigFileName = "next.config.somod.js";

/**
 * @typedef {import("next").NextConfig} NextConfig
 *
 *
 * @typedef {{
 *   images: {
 *     domains: import("next/dist/server/image-config").ImageConfig["domains"]
 *   },
 *   publicRuntimeConfig: NextConfig["publicRuntimeConfig"],
 *   serverRuntimeConfig: NextConfig["serverRuntimeConfig"]
 * }} SodaruNextConfig
 *
 *
 * @callback NextConfigFunction
 * @param {string} phase
 * @param context
 * @returns {Promise<NextConfig>}
 */

/**
 * @param {string} rootDir
 * @param {SodaruNextConfig} config
 *
 * @returns {NextConfigFunction}
 */
module.exports = (rootDir, config) => {
  return async (phase, context) => {
    /**
     * @type {NextConfig}
     */
    let baseConfig = {};
    if (existsSync(join(rootDir, overrideConfigFileName))) {
      const baseConfigExports = require(join(rootDir, overrideConfigFileName));
      if (typeof baseConfigExports == "function") {
        const baseConfigResult = baseConfigExports(phase, context);
        if (baseConfigResult && typeof baseConfigResult.then == "function") {
          baseConfig = await baseConfigResult;
        } else {
          baseConfig = baseConfigResult;
        }
      } else {
        baseConfig = baseConfigExports;
      }
    }

    // merge config into base config;
    if (config.images.domains.length > 0) {
      if (baseConfig.images === undefined) {
        baseConfig.images = {};
      }
      if (baseConfig.images.domains === undefined) {
        baseConfig.images.domains = [];
      }
      config.images.domains.forEach(d => {
        baseConfig.images.domains.push(d);
      });
    }

    if (Object.keys(config.publicRuntimeConfig).length > 0) {
      if (baseConfig.publicRuntimeConfig === undefined) {
        baseConfig.publicRuntimeConfig = {};
      }
      Object.keys(baseConfig.publicRuntimeConfig).forEach(prc => {
        config.publicRuntimeConfig[prc] = baseConfig.publicRuntimeConfig[prc];
      });
      baseConfig.publicRuntimeConfig = config.publicRuntimeConfig;
    }

    if (Object.keys(config.serverRuntimeConfig).length > 0) {
      if (baseConfig.serverRuntimeConfig === undefined) {
        baseConfig.serverRuntimeConfig = {};
      }
      Object.keys(baseConfig.serverRuntimeConfig).forEach(prc => {
        config.serverRuntimeConfig[prc] = baseConfig.serverRuntimeConfig[prc];
      });
      baseConfig.serverRuntimeConfig = config.serverRuntimeConfig;
    }

    return baseConfig;
  };
};
