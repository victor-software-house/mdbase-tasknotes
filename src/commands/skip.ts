import { withCollection, resolveTaskPath } from "../collection.js";
import { showError, showSuccess } from "../format.js";
import { normalizeFrontmatter, denormalizeFrontmatter, resolveDisplayTitle } from "../field-mapping.js";
import { recalculateRecurringSchedule } from "../recurrence.js";
import { resolveDateOrToday } from "../date.js";

export async function skipCommand(
  pathOrTitle: string,
  options: { path?: string; date?: string },
): Promise<void> {
  await setSkipState(pathOrTitle, { ...options, skip: true });
}

export async function unskipCommand(
  pathOrTitle: string,
  options: { path?: string; date?: string },
): Promise<void> {
  await setSkipState(pathOrTitle, { ...options, skip: false });
}

async function setSkipState(
  pathOrTitle: string,
  options: { path?: string; date?: string; skip: boolean },
): Promise<void> {
  try {
    await withCollection(async (collection, mapping) => {
      const taskPath = await resolveTaskPath(collection, pathOrTitle, mapping);
      const read = await collection.read(taskPath);

      if (read.error) {
        showError(`Failed to read task: ${read.error.message}`);
        process.exit(1);
      }

      const fm = normalizeFrontmatter(read.frontmatter as Record<string, unknown>, mapping);
      const taskTitle = resolveDisplayTitle(fm, mapping, taskPath) || taskPath;
      if (typeof fm.recurrence !== "string" || fm.recurrence.trim().length === 0) {
        showError("Skip/unskip is only supported for recurring tasks.");
        process.exit(1);
      }

      const targetDate = resolveDateOrToday(options.date);
      const completeInstances = Array.isArray(fm.completeInstances)
        ? (fm.completeInstances as string[])
        : [];
      const skippedInstances = Array.isArray(fm.skippedInstances)
        ? (fm.skippedInstances as string[])
        : [];

      const alreadySkipped = skippedInstances.includes(targetDate);
      if (options.skip && alreadySkipped) {
        showSuccess(`Recurring instance already skipped on ${targetDate}: ${taskTitle}`);
        return;
      }
      if (!options.skip && !alreadySkipped) {
        showSuccess(`Recurring instance already unskipped on ${targetDate}: ${taskTitle}`);
        return;
      }

      const nextSkippedInstances = options.skip
        ? [...skippedInstances, targetDate]
        : skippedInstances.filter((d) => d !== targetDate);
      const nextCompleteInstances = completeInstances.filter((d) => d !== targetDate);

      const schedule = recalculateRecurringSchedule({
        recurrence: fm.recurrence,
        recurrenceAnchor:
          typeof fm.recurrenceAnchor === "string" ? fm.recurrenceAnchor : undefined,
        scheduled: typeof fm.scheduled === "string" ? fm.scheduled : undefined,
        due: typeof fm.due === "string" ? fm.due : undefined,
        dateCreated: typeof fm.dateCreated === "string" ? fm.dateCreated : undefined,
        completeInstances: nextCompleteInstances,
        skippedInstances: nextSkippedInstances,
        referenceDate: targetDate,
      });

      const fields: Record<string, unknown> = {
        recurrence: schedule.updatedRecurrence,
        completeInstances: nextCompleteInstances,
        skippedInstances: nextSkippedInstances,
      };
      if (schedule.nextScheduled) {
        fields.scheduled = schedule.nextScheduled;
      }
      if (schedule.nextDue) {
        fields.due = schedule.nextDue;
      }

      const result = await collection.update({
        path: taskPath,
        fields: denormalizeFrontmatter(fields, mapping),
      });

      if (result.error) {
        showError(`Failed to ${options.skip ? "skip" : "unskip"} recurring instance: ${result.error.message}`);
        process.exit(1);
      }

      const verb = options.skip ? "Skipped" : "Unskipped";
      const nextInfo = schedule.nextScheduled ? ` → next ${schedule.nextScheduled}` : "";
      showSuccess(`${verb} recurring instance (${targetDate}): ${taskTitle}${nextInfo}`);
    }, options.path);
  } catch (err) {
    showError((err as Error).message);
    process.exit(1);
  }
}
