#!/usr/bin/env bash
# Build the paper2notes image, push it to Artifact Registry, roll it out to the
# Cloud Run service, and check the site answers.
#
# Used by .github/workflows/deploy-notes.yml (monorepo root) and
# .github/workflows/deploy.yml (standalone paper2notes); runnable locally
# by anyone whose gcloud identity can push to the registry and deploy the
# service (or, to exercise the CI identity exactly, with
# CLOUDSDK_AUTH_IMPERSONATE_SERVICE_ACCOUNT=<deployer email>):
#
#   paper2notes/deploy/cloudrun/deploy.sh  # from monorepo root
#   deploy/cloudrun/deploy.sh               # from standalone checkout
set -euo pipefail

PROJECT_ID="${GCP_PROJECT_ID:-paper2notes-site}"
REGION="${GCP_REGION:-asia-east2}"
SERVICE="${GCP_RUN_SERVICE:-paper2notes}"
REPOSITORY="${GCP_AR_REPOSITORY:-paper2notes}"

# repo_root is paper2notes/ in standalone, or paper2everything/ in the monorepo.
# Detect monorepo: if paper2notes/notes exists at the git top-level, use that.
script_dir="$(cd "$(dirname "$0")" && pwd)"
# paper2notes/deploy/cloudrun -> paper2notes
maybe_p2n="$(cd "$script_dir/../.." && pwd)"
# git top-level (monorepo root if present)
if git -C "$maybe_p2n" rev-parse --show-toplevel >/dev/null 2>&1; then
  git_root="$(git -C "$maybe_p2n" rev-parse --show-toplevel)"
  if [ -d "$git_root/paper2notes/notes/book5" ]; then
    repo_root="$git_root"
    notes_src="paper2notes/notes"
    dockerfile="paper2notes/deploy/cloudrun/Dockerfile"
  else
    repo_root="$maybe_p2n"
    notes_src="notes"
    dockerfile="deploy/cloudrun/Dockerfile"
  fi
else
  repo_root="$maybe_p2n"
  notes_src="notes"
  dockerfile="deploy/cloudrun/Dockerfile"
fi
if [ ! -d "$repo_root/$notes_src/book5" ]; then echo "deploy: $notes_src/book5 missing under $repo_root" >&2; exit 1; fi

sha="$(git -C "$repo_root" rev-parse HEAD 2>/dev/null | cut -c1-6 || echo local)"
if [ -z "$sha" ]; then sha="local"; fi
subject="$(git -C "$repo_root" log -1 --format=%s 2>/dev/null || true)"
# Inject deploy-commit footer into the notes tree before copying into the image.
# The Dockerfile also has a fallback RUN that re-injects via build-arg, so
# standalone `docker build -f Dockerfile .` without deploy.sh still gets a footer.
if [ -f "$repo_root/paper2notes/scripts/inject-commit-footer.mjs" ]; then
  echo "deploy: injecting commit footer $sha into $repo_root/$notes_src"
  node "$repo_root/paper2notes/scripts/inject-commit-footer.mjs" --commit "$sha" --subject "$subject" --root "$repo_root/$notes_src" || echo "deploy: footer inject failed (continuing)"
fi
registry="$REGION-docker.pkg.dev"
image="$registry/$PROJECT_ID/$REPOSITORY/site"
tag="$image:$(date -u +%Y%m%dT%H%M%SZ)-$sha"

echo "deploy: building $tag from $repo_root (dockerfile $dockerfile, notes $notes_src)"
# Cloud Run runs amd64; build for it explicitly so laptops on arm64 work too.
docker build --platform linux/amd64 --build-arg GIT_COMMIT="$sha" -f "$repo_root/$dockerfile" -t "$tag" "$repo_root"

gcloud auth configure-docker "$registry" --quiet
docker push "$tag"

echo "deploy: rolling out to Cloud Run service $SERVICE ($REGION, $PROJECT_ID)"
gcloud run deploy "$SERVICE" --project "$PROJECT_ID" --region "$REGION" \
  --image "$tag" --quiet

url="$(gcloud run services describe "$SERVICE" --project "$PROJECT_ID" --region "$REGION" \
  --format='value(status.url)')"
for path in "/" "/book2/" "/book4/" "/book5/"; do
  echo "deploy: verifying $url$path"
  ok=0
  for _ in 1 2 3 4 5; do
    if curl -fsS -o /dev/null "$url$path"; then ok=1; break; fi
    sleep 3
  done
  if [ "$ok" -eq 0 ]; then echo "deploy: site did not answer at $url$path" >&2; exit 1; fi
  echo "deploy: ok $url$path"
done
exit 0
