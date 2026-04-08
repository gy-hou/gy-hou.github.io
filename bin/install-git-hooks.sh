#!/usr/bin/env bash
set -euo pipefail

repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"

if [ ! -f ".githooks/pre-commit" ]; then
  echo "[hooks:install] Missing .githooks/pre-commit"
  exit 1
fi

chmod +x .githooks/pre-commit
git config core.hooksPath .githooks

echo "[hooks:install] Installed. Git hooks path set to .githooks"
echo "[hooks:install] Prettier will now run automatically on staged files before each commit."
