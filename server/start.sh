#!/usr/bin/env bash
PORT="${PORT:-3000}"

npx json-server --watch server/db.json --routes server/routes.json --port "$PORT" --host 0.0.0.0
