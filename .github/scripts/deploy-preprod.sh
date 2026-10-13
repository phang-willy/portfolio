#!/usr/bin/env bash
# Updates a server checkout and recreates the Compose stack for that branch.
# DEPLOY_BRANCH selects pre-prod or main. The server .env and Docker volumes stay in place.
set -euo pipefail

if [ -z "${DEPLOY_PATH:-}" ]; then
  echo "DEPLOY_PATH is required." >&2
  exit 1
fi

repo_url="https://github.com/phang-willy/portfolio.git"
branch="${DEPLOY_BRANCH:-pre-prod}"

case "$branch" in
  pre-prod|main) ;;
  *)
    echo "Unsupported branch: ${branch}" >&2
    exit 1
    ;;
esac

if [ ! -d "${DEPLOY_PATH}/.git" ]; then
  mkdir -p "$(dirname "$DEPLOY_PATH")"
  git clone --branch "$branch" --single-branch "$repo_url" "$DEPLOY_PATH"
fi

cd "$DEPLOY_PATH"

if [ ! -f .env ]; then
  echo "Missing ${DEPLOY_PATH}/.env. Create the environment file on the server before deploying." >&2
  exit 1
fi

git fetch origin "$branch"
git checkout -f -B "$branch" "origin/${branch}"

echo "Deploying $(git rev-parse --short HEAD) from ${branch}"

# Shell value wins over COMPOSE_PROFILES in .env, so MailDev and Adminer stay stopped.
export COMPOSE_PROFILES=prod
docker compose up -d --build --remove-orphans --wait --wait-timeout 600
docker image prune -f
docker compose ps
