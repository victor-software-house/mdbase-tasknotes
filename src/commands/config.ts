import { c } from "../colors.js";
import { getConfig, setConfig, getConfigPath } from "../config.js";
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
    console.log(config[key] ?? "(not set)");
    return;
  }

  // Default: list all
  const config = await getConfig();
  console.log(c.dim(`Config file: ${getConfigPath()}\n`));
  for (const [key, value] of Object.entries(config)) {
    console.log(`  ${key}: ${value ?? c.dim("(not set)")}`);
  }
}
