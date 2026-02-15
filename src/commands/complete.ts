import { withCollection, resolveTaskPath } from "../collection.js";
import { showError, showSuccess } from "../format.js";
import {
  normalizeFrontmatter,
  denormalizeFrontmatter,
  getDefaultCompletedStatus,
  isCompletedStatus,
  resolveDisplayTitle,
} from "../field-mapping.js";
import { completeRecurringTask } from "../recurrence.js";
import { resolveDateOrToday } from "../date.js";
import { localISOString } from "../mapper.js";

export async function completeCommand(
  pathOrTitle: string,
  options: { path?: string; date?: string },
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
      const isRecurring = typeof fm.recurrence === "string" && fm.recurrence.trim().length > 0;
      const completionStatus = getDefaultCompletedStatus(mapping);

      if (!isRecurring && isCompletedStatus(mapping, typeof fm.status === "string" ? fm.status : undefined)) {
        showSuccess(`Task "${taskTitle}" is already completed.`);
        return;
      }

      const today = resolveDateOrToday(options.date);
      if (isRecurring) {
        const completeInstances = Array.isArray(fm.completeInstances)
          ? (fm.completeInstances as string[])
          : [];
        if (completeInstances.includes(today)) {
          showSuccess(`Recurring instance already completed on ${today}: ${taskTitle}`);
          return;
        }

        const recurring = completeRecurringTask({
          recurrence: fm.recurrence as string,
          recurrenceAnchor:
            typeof fm.recurrenceAnchor === "string" ? fm.recurrenceAnchor : undefined,
          scheduled: typeof fm.scheduled === "string" ? fm.scheduled : undefined,
          due: typeof fm.due === "string" ? fm.due : undefined,
          dateCreated: typeof fm.dateCreated === "string" ? fm.dateCreated : undefined,
          completionDate: today,
          completeInstances: Array.isArray(fm.completeInstances)
            ? (fm.completeInstances as string[])
            : undefined,
          skippedInstances: Array.isArray(fm.skippedInstances)
            ? (fm.skippedInstances as string[])
            : undefined,
        });

        if (!recurring.nextScheduled) {
          const result = await collection.update({
            path: taskPath,
            fields: denormalizeFrontmatter(
              {
                status: completionStatus,
                completedDate: today,
                recurrence: recurring.updatedRecurrence,
                completeInstances: recurring.completeInstances,
                skippedInstances: recurring.skippedInstances,
                dateModified: localISOString(),
              },
              mapping,
            ),
          });

          if (result.error) {
            showError(`Failed to complete task: ${result.error.message}`);
            process.exit(1);
          }

          showSuccess(`Completed: ${taskTitle}`);
          return;
        }

        const fields: Record<string, unknown> = {
          recurrence: recurring.updatedRecurrence,
          scheduled: recurring.nextScheduled,
          completeInstances: recurring.completeInstances,
          skippedInstances: recurring.skippedInstances,
          dateModified: localISOString(),
        };

        if (recurring.nextDue) {
          fields.due = recurring.nextDue;
        }

        const result = await collection.update({
          path: taskPath,
          fields: denormalizeFrontmatter(fields, mapping),
        });

        if (result.error) {
          showError(`Failed to complete recurring task: ${result.error.message}`);
          process.exit(1);
        }

        showSuccess(`Completed recurring instance: ${taskTitle} → next ${recurring.nextScheduled}`);
        return;
      }

      const result = await collection.update({
        path: taskPath,
        fields: denormalizeFrontmatter({
          status: completionStatus,
          completedDate: today,
          dateModified: localISOString(),
        }, mapping),
      });

      if (result.error) {
        showError(`Failed to complete task: ${result.error.message}`);
        process.exit(1);
      }

      showSuccess(`Completed: ${taskTitle}`);
    }, options.path);
  } catch (err) {
    showError((err as Error).message);
    process.exit(1);
  }
}
