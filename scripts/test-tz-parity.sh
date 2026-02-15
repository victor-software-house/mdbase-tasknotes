#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP_OUT="$ROOT_DIR/.tmp-test-build"

cleanup() {
  rm -rf "$TMP_OUT"
}
trap cleanup EXIT

cd "$ROOT_DIR"
rm -rf "$TMP_OUT"
npx esbuild src/date.ts src/recurrence.ts --outdir="$TMP_OUT" --format=esm --platform=node

probe='
import { formatDateForStorage } from "./.tmp-test-build/date.js";
import { completeRecurringTask } from "./.tmp-test-build/recurrence.js";

const dateOnly = completeRecurringTask({
  recurrence: "FREQ=WEEKLY;BYDAY=FR",
  recurrenceAnchor: "scheduled",
  scheduled: "2025-01-10",
  due: "2025-01-10",
  dateCreated: "2025-01-01T10:00:00Z",
  completionDate: "2025-01-10",
  completeInstances: [],
  skippedInstances: [],
});

const dateTimeZ = completeRecurringTask({
  recurrence: "FREQ=DAILY",
  recurrenceAnchor: "scheduled",
  scheduled: "2025-01-10T15:00:00Z",
  due: "2025-01-10T17:00:00Z",
  dateCreated: "2025-01-01T10:00:00Z",
  completionDate: "2025-01-10",
  completeInstances: [],
  skippedInstances: [],
});

console.log(JSON.stringify({
  storageUTC: formatDateForStorage(new Date("2025-01-21T23:00:00Z")),
  dateOnly: {
    nextScheduled: dateOnly.nextScheduled,
    nextDue: dateOnly.nextDue,
  },
  dateTimeZ: {
    nextScheduled: dateTimeZ.nextScheduled,
    nextDue: dateTimeZ.nextDue,
  },
}));
'

baseline_tz="UTC"
baseline="$(TZ="$baseline_tz" node --input-type=module -e "$probe")"

for tz in "America/Los_Angeles" "Europe/Berlin" "Asia/Tokyo"; do
  current="$(TZ="$tz" node --input-type=module -e "$probe")"
  if [[ "$current" != "$baseline" ]]; then
    echo "Timezone parity mismatch for TZ=$tz" >&2
    echo "Baseline ($baseline_tz): $baseline" >&2
    echo "Current ($tz): $current" >&2
    exit 1
  fi
done

echo "Timezone parity checks passed across UTC, America/Los_Angeles, Europe/Berlin, Asia/Tokyo"
