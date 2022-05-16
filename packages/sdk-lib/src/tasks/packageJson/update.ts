import { getCommandVersion } from "@solib/cli-base";
import {
  file_index_dts,
  file_index_js,
  key_files,
  key_jsnextMain,
  key_main,
  key_module,
  key_njp,
  key_sideEffects,
  key_slp,
  key_somod,
  key_type,
  key_typings,
  ModuleType,
  path_build
} from "../../utils/constants";
import { read, update as _updatePackageJson } from "../../utils/packageJson";

export const update = async (dir: string, type: ModuleType): Promise<void> => {
  const packageJson = await read(dir);

  const keysToBeUpdated = [
    "name",
    "version",
    "description",
    key_main,
    key_jsnextMain,
    key_type,
    key_module,
    key_typings,
    key_files,
    key_sideEffects,
    key_njp,
    key_slp,
    key_somod
  ];

  const toBeUpdatedPackageJsonData: Record<string, unknown> = {};

  keysToBeUpdated.forEach(key => {
    toBeUpdatedPackageJsonData[key] = packageJson[key];
    delete packageJson[key];
  });

  delete toBeUpdatedPackageJsonData[key_main];
  delete toBeUpdatedPackageJsonData[key_jsnextMain];
  delete toBeUpdatedPackageJsonData[key_type];

  toBeUpdatedPackageJsonData[key_module] = `${path_build}/${file_index_js}`;

  toBeUpdatedPackageJsonData[key_typings] = `${path_build}/${file_index_dts}`;

  if (!toBeUpdatedPackageJsonData[key_files]) {
    toBeUpdatedPackageJsonData[key_files] = [];
  }
  if (
    !(toBeUpdatedPackageJsonData[key_files] as string[]).includes(path_build)
  ) {
    (toBeUpdatedPackageJsonData[key_files] as string[]).push(path_build);
  }

  toBeUpdatedPackageJsonData[key_sideEffects] = false;

  const commandVersion = await getCommandVersion();

  delete toBeUpdatedPackageJsonData[key_njp];
  delete toBeUpdatedPackageJsonData[key_slp];
  delete toBeUpdatedPackageJsonData[key_somod];

  if (type == "njp") {
    toBeUpdatedPackageJsonData[key_njp] = commandVersion;
  } else if (type == "slp") {
    toBeUpdatedPackageJsonData[key_slp] = commandVersion;
  } else {
    toBeUpdatedPackageJsonData[key_somod] = commandVersion;
  }

  _updatePackageJson(dir, {
    ...toBeUpdatedPackageJsonData,
    ...packageJson
  });
};

export const updateSodaruModuleKey = async (
  dir: string,
  type: ModuleType
): Promise<void> => {
  const packageJson = await read(dir);
  packageJson[type] = await getCommandVersion();
  _updatePackageJson(dir, packageJson);
};