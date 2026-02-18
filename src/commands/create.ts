import { mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { c } from "../colors.js";
import { withCollection } from "../collection.js";
import { getProjectFolder } from "../config.js";
import { createParser } from "../nlp.js";
import { mapToFrontmatter } from "../mapper.js";
import { formatTask, showError, showSuccess } from "../format.js";
import { denormalizeFrontmatter, normalizeFrontmatter } from "../field-mapping.js";
import { zettelFilename } from "../zettel.js";
import type { TaskResult } from "../types.js";

/**
 * Resolve the target path for a new task file.
 * Uses project folder registry if the task has a project, falls back to
 * zettel-named file in the default task directory.
 */
async function resolveTaskPath(
  title: string,
  projects: string[],
  collectionRoot: string,
): Promise<string | undefined> {
  const filename = zettelFilename(title);
  const project = projects[0];

  if (project) {
    const folder = await getProjectFolder(project);
    if (folder) {
      const dir = join(collectionRoot, folder);
      mkdirSync(dir, { recursive: true });
      return join(folder, filename);
    }
  }

  return undefined;
}

export async function createCommand(
  text: string[],
  options: { path?: string },
): Promise<void> {
  const input = text.join(" ").trim();
  if (!input) {
    showError("Please provide task text.");
    process.exit(1);
  }

  try {
    const parser = await createParser(options.path);
    const parsed = parser.parseInput(input);
    const { frontmatter, body } = mapToFrontmatter(parsed);

    await withCollection(async (collection, mapping) => {
      const taskPath = await resolveTaskPath(
        frontmatter.title ?? "untitled",
        parsed.projects,
        (collection as unknown as { root: string }).root,
      );

      const result = await collection.create({
        type: "task",
        path: taskPath,
        frontmatter: denormalizeFrontmatter(frontmatter as Record<string, unknown>, mapping),
        body,
      });

      if (result.error) {
        showError(`Failed to create task: ${result.error.message}`);
        process.exit(1);
      }

      // Ensure parent directory exists (for cases where mdbase creates in a subfolder)
      if (result.path) {
        const fullDir = join((collection as unknown as { root: string }).root, dirname(result.path));
        mkdirSync(fullDir, { recursive: true });
      }

      const fm = normalizeFrontmatter(result.frontmatter as Record<string, unknown>, mapping);

      const task: TaskResult = {
        path: result.path!,
        frontmatter: fm as any,
      };

      showSuccess("Task created");
      console.log(formatTask(task));
      console.log(c.dim(`  → ${result.path}`));
    }, options.path);
  } catch (err) {
    showError((err as Error).message);
    process.exit(1);
  }
}
