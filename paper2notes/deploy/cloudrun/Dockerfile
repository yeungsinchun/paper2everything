# Static image for the paper2notes site on Cloud Run.
# Monorepo build: context is the repo root (paper2everything), not paper2notes/.
#   docker build -f paper2notes/deploy/cloudrun/Dockerfile .
# Standalone paper2notes checkouts can still build with:
#   docker build -f deploy/cloudrun/Dockerfile paper2notes
FROM nginxinc/nginx-unprivileged:stable-alpine

COPY paper2notes/deploy/cloudrun/nginx.conf /etc/nginx/conf.d/default.conf
# .dockerignore (at repo root) keeps paper2notes/notes/_source, _local and *.test.mjs out of the image.
COPY paper2notes/notes/ /usr/share/nginx/html/

EXPOSE 8080
