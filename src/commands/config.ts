import { c } from "../colors.js";
import {
  getConfig,
  setConfig,
  getConfigPath,
  setProjectFolder,
  removeProjectFolder,
  listProjectFolders,
} from "../config.js";
import { showError, showSuccess } from "../format.js";

export async function configCommand(options: {
  set?: string;
  get?: string;
  list?: boolean;
}): Promise<void> {
  if (options.set) {
    const eqIndex = options.set.indexOf("=");
    if (eqIndex === -1) {
      showError('Invalid format. Use --set key=value (e.g., --set collectionPath=/path/to/vault)');
      process.exit(1);
    }
    const key = options.set.slice(0, eqIndex);
    const value = options.set.slice(eqIndex + 1);

    if (key !== "collectionPath" && key !== "language") {
      showError(`Unknown config key: ${key}. Valid keys: collectionPath, language`);
      process.exit(1);
    }

    await setConfig(key, value || null);
    showSuccess(`Set ${key} = ${value || "(null)"}`);
    return;
  }

  if (options.get) {
    const config = await getConfig();
    const key = options.get as keyof typeof config;
    if (!(key in config)) {
      showError(`Unknown config key: ${key}. Valid keys: collectionPath, language`);
      process.exit(1);
    }
    const val = config[key];
    if (typeof val === "object" && val !== null) {
      console.log(JSON.stringify(val, null, 2));
    } else {
      console.log(val ?? "(not set)");
    }
    return;
  }

  // Default: list all
  const config = await getConfig();
  console.log(c.dim(`Config file: ${getConfigPath()}\n`));
  for (const [key, value] of Object.entries(config)) {
    if (typeof value === "object" && value !== null) {
      console.log(`  ${key}:`);
      for (const [k, v] of Object.entries(value)) {
        console.log(`    ${k}: ${v}`);
      }
    } else {
      console.log(`  ${key}: ${value ?? c.dim("(not set)")}`);
    }
  }
}

export async function setProjectFolderCommand(
  name: string,
  path: string,
): Promise<void> {
  await setProjectFolder(name, path);
  showSuccess(`Project folder set: ${name} -> ${path}`);
}

export async function removeProjectFolderCommand(
  name: string,
): Promise<void> {
  const removed = await removeProjectFolder(name);
  if (removed) {
    showSuccess(`Removed project folder: ${name}`);
  } else {
    showError(`Project folder not found: ${name}`);
    process.exit(1);
  }
}

export async function listProjectFoldersCommand(): Promise<void> {
  const folders = await listProjectFolders();
  const entries = Object.entries(folders);
  if (entries.length === 0) {
    console.log(c.dim("No project folders configured."));
    return;
  }
  for (const [name, path] of entries) {
    console.log(`  ${name}: ${path}`);
  }
}
