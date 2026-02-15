#!/bin/bash
# Patch @callumalpass/mdbase to use bun:sqlite instead of better-sqlite3
# This runs as postinstall to ensure the patch survives npm/bun installs
WORKER="node_modules/@callumalpass/mdbase/dist/cache/worker.js"
if [ -f "$WORKER" ]; then
  cp src/shims/bun-sqlite-worker.js "$WORKER"
fi
