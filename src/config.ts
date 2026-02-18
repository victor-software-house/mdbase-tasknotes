import { mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { homedir } from "node:os";
import type { CLIConfig } from "./types.js";

const CONFIG_DIR = join(homedir(), ".config", "mdbase-tasknotes");
const CONFIG_FILE = join(CONFIG_DIR, "config.json");

const DEFAULT_CONFIG: CLIConfig = {
  collectionPath: null,
  language: "en",
};

async function load(): Promise<CLIConfig> {
  try {
    const data = await Bun.file(CONFIG_FILE).json();
    return { ...DEFAULT_CONFIG, ...data };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

async function save(config: CLIConfig): Promise<void> {
  mkdirSync(CONFIG_DIR, { recursive: true });
  await Bun.write(CONFIG_FILE, JSON.stringify(config, null, 2) + "\n");
}

export async function getConfig(): Promise<CLIConfig> {
  return load();
}

export async function setConfig(key: string, value: string | null): Promise<void> {
  const config = await load();
  if (key === "collectionPath") {
    config.collectionPath = value;
  } else if (key === "language") {
    config.language = value ?? "en";
  }
  await save(config);
}

export async function setProjectFolder(name: string, path: string): Promise<void> {
  const config = await load();
  config.projectFolders ??= {};
  config.projectFolders[name] = path;
  await save(config);
}

export async function removeProjectFolder(name: string): Promise<boolean> {
  const config = await load();
  if (!config.projectFolders || !(name in config.projectFolders)) {
    return false;
  }
  delete config.projectFolders[name];
  await save(config);
  return true;
}

export async function getProjectFolder(name: string): Promise<string | undefined> {
  const config = await load();
  return config.projectFolders?.[name];
}

export async function listProjectFolders(): Promise<Record<string, string>> {
  const config = await load();
  return config.projectFolders ?? {};
}

export function getConfigPath(): string {
  return CONFIG_FILE;
}

export async function resolveCollectionPath(flagPath?: string): Promise<string> {
  if (flagPath) return resolve(flagPath);
  const envPath = process.env.MDBASE_TASKNOTES_PATH;
  if (envPath) return resolve(envPath);
  const config = await load();
  if (config.collectionPath) return resolve(config.collectionPath);
  return process.cwd();
}
