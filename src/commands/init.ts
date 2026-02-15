import { c } from "../colors.js";
import { initCollection, initCollectionForce } from "../init.js";

export async function initCommand(
  targetPath: string | undefined,
  options: { force?: boolean },
): Promise<void> {
  const target = targetPath || process.cwd();

  try {
    const init = options.force ? initCollectionForce : initCollection;
    const { created } = await init(target);

    console.log(c.green("✓") + " Initialized mdbase-tasknotes collection:");
    for (const file of created) {
      console.log(c.dim("  " + file));
    }
    console.log("");
    console.log(`Collection path: ${c.cyan(target)}`);
    console.log(`Create tasks with: ${c.cyan("mtn create \"Buy groceries tomorrow #shopping\"")}`);
  } catch (err) {
    console.error(c.red("✗") + ` ${(err as Error).message}`);
    process.exit(1);
  }
}
