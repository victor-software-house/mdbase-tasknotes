---
id: 'github:callumalpass/mdbase-tasknotes:issue:3'
repo: callumalpass/mdbase-tasknotes
kind: issue
number: 3
remote_state: OPEN
remote_title: 'Bug: 当标题存储在文件名时，mtn 命令无法显示/查询任务'
remote_author: sunjiawe
remote_url: 'https://github.com/callumalpass/mdbase-tasknotes/issues/3'
remote_updated_at: '2026-02-17T00:51:38Z'
last_seen_remote_updated_at: '2026-02-17T00:51:38Z'
local_status: done
priority: high
difficulty: medium
risk: medium
sync_state: clean
type: item_state
command_id: triage-issue
last_analyzed_at: '2026-02-17T11:55:44Z'
summary: >
  `mtn` currently treats the task title as frontmatter-only in key paths
  (`resolveTaskPath` query and task formatting). When TaskNotes stores title in
  filename, frontmatter often has no `title` value, so `mtn list`/`mtn show`
  render blank titles and `mtn show <name>` cannot resolve by task name.
notes: |
  ## Root Cause Analysis

  - `resolveTaskPath()` in `src/collection.ts` resolves non-path arguments by
    querying only `resolveField(mapping, "title")` in frontmatter.
  - In filename-title mode, that field is typically absent, so exact/contains
    title queries return no rows and `show/update/complete/... <title>` fail.
  - Output formatting relies on `fm.title`; `list` only fills it when
    `resolveDisplayTitle()` finds a mapped frontmatter key, with no file-path
    fallback. `show` does not apply `resolveDisplayTitle()` at all before
    rendering.

  ## Suggested Fixes

  Preferred approach:
  - Add a single helper that resolves display/lookup title with fallback order:
    `frontmatter title-like field -> normalized title role -> basename(path)`.
  - Use this helper in:
    - `list/show/search/projects/timer` display paths.
    - `resolveTaskPath()` candidate matching when frontmatter title is missing
      (query broad set, rank by resolved display title + basename + path).
  - Add tests covering filename-title mode (no frontmatter `title`) for `list`
    output and `show <taskname>` resolution.

  Fallback option:
  - Add config/flag to set title source (`frontmatter|filename|auto`) and use
    `filename` mode to force basename matching when title field is absent.
  - Minimal safe fallback: keep current frontmatter query, then run a second
    pass over queried tasks matching basename equals/contains input.

  ## Fix Applied

  - Added filename fallback to `resolveDisplayTitle()` so display title resolves
    from `basename(task.path)` when frontmatter title-like fields are missing.
  - Updated task lookup in `resolveTaskPath()` to query by frontmatter title
    first, then `file.basename`, then fuzzy title/basename matching with
    de-duplication and ranking.
  - Updated rendering and success-message paths to use display-title fallback
    consistently across list/show/search/projects/timer/complete/skip/archive/update.
  - Added regression test `tests/filename-title-mode.test.mjs` to verify
    list/show/complete behavior when frontmatter `title` is missing.
---
