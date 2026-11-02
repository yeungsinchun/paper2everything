# Hosting on Cloud Run

The notes are served as static files by nginx in a container on Cloud Run.

| Item | Value |
|------|-------|
| GCP project | `paper2notes-site` (152505675251) |
| Service | `paper2notes`, region `asia-east2` (Hong Kong), public, scale-to-zero, max 2 instances, 1 vCPU / 128 MiB, runs as `paper2notes-runtime@paper2notes-site.iam.gserviceaccount.com` (no roles) |
| Site | https://paper2notes-152505675251.asia-east2.run.app/ (landing page at `/` lists every book; each book at `/book2/`, `/book4/`, `/book5/`); HTTPS is provided by Cloud Run |
| Image | `asia-east2-docker.pkg.dev/paper2notes-site/paper2notes/site:<utc-timestamp>-<sha>`, `nginxinc/nginx-unprivileged:stable-alpine` + `notes/` (about 63 MB) |
| Deployer | `paper2notes-deployer@paper2notes-site.iam.gserviceaccount.com` |

Files:

- `Dockerfile` + `nginx.conf` - the image; the monorepo-root `.dockerignore` keeps everything except `paper2notes/notes/` (minus `_source/` and `_local/`) and `paper2notes/deploy/cloudrun/nginx.conf` out of the build context. Build from the monorepo root: `docker build -f paper2notes/deploy/cloudrun/Dockerfile .` (the image copies `paper2notes/notes/` to `/usr/share/nginx/html/`, then injects/updates a muted `deploy-commit-footer` showing the first 6 chars of `GIT_COMMIT` (and, when `deploy.sh`/the injector set it, the commit subject) via `ARG GIT_COMMIT` fallback and stages `notes/dse/` to `_local/dse/`).
- `provision.sh` - idempotent, creates everything above (run once by a human with billing access). It also creates the Cloud Run service with a placeholder image and sets the public-invoker binding, which the deployer is not allowed to do.
- `deploy.sh` - what CI runs: resolves the 6-char `HEAD` (or `local`), injects/updates the footer (commit ID + `git log -1 --format=%s` subject, HTML-escaped) into every `paper2notes/notes/**/*.html` via `paper2notes/scripts/inject-commit-footer.mjs --commit <sha>` and passes `--build-arg GIT_COMMIT=<sha>` before `docker build --platform linux/amd64`, pushes to Artifact Registry, `gcloud run deploy --image`, then checks `<service url>/`, `/book2/`, `/book4/`, `/book5/` return 200.

Every deployed HTML page (all `paper2notes/notes/**/*.html` except `_source`/`_local`) ends with that muted footer (`<footer class="deploy-commit-footer" data-commit="<6-char>">deployed commit: <code>…</code> <span class="deploy-commit-subject">commit subject</span></footer>`) so a deploy in flight can be identified in the browser; `node paper2notes/scripts/ci-check.mjs` fails if any deployed HTML lacks it or has a malformed `data-commit`. Local `python -m http.server --directory paper2notes/notes` previews show the last committed footer until you refresh with `node paper2notes/scripts/inject-commit-footer.mjs --commit $(git rev-parse HEAD | cut -c1-6)` (subject is read from git; override with `--subject`).

`.github/workflows/deploy-notes.yml` (at the monorepo root) runs `paper2notes/deploy/cloudrun/deploy.sh` on every push to `main` that touches `paper2notes/notes/`, `paper2notes/deploy/cloudrun/`, `.dockerignore`, or the workflow (or manually via *Run workflow*). It authenticates with Workload Identity Federation, so no cloud key is stored anywhere; the two GitHub secrets `GCP_WORKLOAD_IDENTITY_PROVIDER` and `GCP_DEPLOYER_SERVICE_ACCOUNT` are resource names printed by `provision.sh`.

Access model:

- The deployer service account has `roles/run.developer` on the project, `roles/artifactregistry.writer` on the `paper2notes` repository, and `roles/iam.serviceAccountUser` on the runtime service account. It cannot change who may invoke the service. Only workflows from `yeungsinchun/paper2everything` can impersonate it (cut over from `yeungsinchun/paper2notes`; see needs-decision for WIF migration).
- The container runs as a service account with no permissions and the image contains only nginx and the notes.
- To deploy from a laptop, any project Owner can run `paper2notes/deploy/cloudrun/deploy.sh` (needs Docker) from the monorepo root. To exercise exactly the CI identity, prefix it with `CLOUDSDK_AUTH_IMPERSONATE_SERVICE_ACCOUNT=paper2notes-deployer@paper2notes-site.iam.gserviceaccount.com` (`provision.sh` grants the account that ran it `roles/iam.serviceAccountTokenCreator` on the deployer).
- Artifact Registry keeps the 5 newest images and deletes older ones after a day, so rollback to a recent image is `gcloud run deploy paper2notes --region asia-east2 --image <older tag>`.

Monthly cost (as of Sep 2026): Cloud Run's Always Free tier covers 2 million requests, 180,000 vCPU-seconds and 360,000 GiB-seconds per month, and the service scales to zero between visits, so compute is expected to be $0. Artifact Registry storage stays under its 0.5 GB free allowance. Outbound traffic from `asia-east2` is charged (~$0.12/GB); the whole site is about 1.3 MB compressed, so even a few hundred visits a month is cents.

The service originally ran in `asia-east1` (Taiwan); it and its Artifact Registry repository were deleted after the move to `asia-east2` (Hong Kong).
