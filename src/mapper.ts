import type { ParsedTaskData } from "tasknotes-nlp-core";
import type { TaskFrontmatter } from "./types.js";

/**
 * ISO 8601 timestamp with local timezone offset (matches TaskNotes plugin format).
 */
export function localISOString(date?: Date): string {
  const d = date || new Date();
  const off = d.getTimezoneOffset();
  const sign = off <= 0 ? "+" : "-";
  const absOff = Math.abs(off);
  const hh = String(Math.floor(absOff / 60)).padStart(2, "0");
  const mm = String(absOff % 60).padStart(2, "0");
  const local = new Date(d.getTime() - off * 60_000);
  return local.toISOString().replace("Z", `${sign}${hh}:${mm}`);
}

/**
 * Map NLP ParsedTaskData to mdbase task frontmatter fields.
 * Projects are stored as plain strings (compatible with TaskNotes plugin).
 * The "task" tag is always included for plugin identification.
 */
export function mapToFrontmatter(parsed: ParsedTaskData): {
  frontmatter: Partial<TaskFrontmatter>;
  body?: string;
} {
  const fm: Partial<TaskFrontmatter> = {};

  fm.title = parsed.title;

  if (parsed.dueDate) fm.due = parsed.dueDate;
  if (parsed.scheduledDate) fm.scheduled = parsed.scheduledDate;
  if (parsed.priority) fm.priority = parsed.priority;
  if (parsed.status) fm.status = parsed.status;

  const tags = parsed.tags && parsed.tags.length > 0 ? [...parsed.tags] : [];
  if (!tags.includes("task")) tags.unshift("task");
  fm.tags = tags;

  if (parsed.contexts && parsed.contexts.length > 0) fm.contexts = parsed.contexts;
  if (parsed.projects && parsed.projects.length > 0) {
    fm.projects = parsed.projects;
  }
  if (parsed.recurrence) fm.recurrence = parsed.recurrence;
  if (parsed.estimate) fm.timeEstimate = parsed.estimate;

  const now = localISOString();
  fm.dateCreated = now;
  fm.dateModified = now;

  const body = parsed.details || undefined;

  return { frontmatter: fm, body };
}

/**
 * Map frontmatter back to a display-friendly object for showing tasks.
 * Extracts project names from wikilinks.
 */
export function extractProjectNames(projects?: string[]): string[] {
  if (!projects) return [];
  return projects.filter(Boolean).map((p) => {
    const match = p.match(/\[\[(?:.*\/)?([^\]]+)\]\]/);
    return match ? match[1] : p;
  });
}
