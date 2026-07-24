#!/usr/bin/env bash
set -euo pipefail
project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
require_setting(){ local name="$1"; if [ -z "${!name:-}" ] && ! grep -Eq "^${name}=.+" "$project_dir/.env" 2>/dev/null; then echo "Missing required setting: $name" >&2; exit 1; fi; }
[ -f "$project_dir/.env" ] || { echo 'Create .env from .env.example first.' >&2; exit 1; }
set -a
# shellcheck disable=SC1091
source "$project_dir/.env"
set +a
[ -d "$project_dir/server/node_modules" ] && [ -d "$project_dir/client/node_modules" ] || { echo 'Dependencies are absent; install them explicitly with npm ci in server/ and client/.' >&2; exit 1; }
require_setting DATABASE_URL; require_setting JWT_SECRET
cleanup(){ kill "${backend_pid:-}" "${frontend_pid:-}" 2>/dev/null || true; wait "${backend_pid:-}" "${frontend_pid:-}" 2>/dev/null || true; }
trap cleanup EXIT INT TERM
(cd "$project_dir/server" && npm start) & backend_pid=$!
(cd "$project_dir/client" && npm run dev -- --host "${HOST:-127.0.0.1}" --port "${FRONTEND_PORT:-3000}") & frontend_pid=$!
echo 'Services started without installing dependencies, changing ports, or mutating the database.'
wait "$backend_pid" "$frontend_pid"
