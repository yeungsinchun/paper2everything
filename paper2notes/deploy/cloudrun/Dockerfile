# Static image for the paper2notes site on Cloud Run.
# Monorepo build: context is the repo root (paper2everything), not paper2notes/.
#   docker build -f paper2notes/deploy/cloudrun/Dockerfile .
# Standalone paper2notes checkouts can still build with:
#   docker build -f deploy/cloudrun/Dockerfile paper2notes
FROM nginxinc/nginx-unprivileged:stable-alpine

COPY paper2notes/deploy/cloudrun/nginx.conf /etc/nginx/conf.d/default.conf
# .dockerignore (at repo root) keeps paper2notes/notes/_source, _local and *.test.mjs out of the image.
COPY paper2notes/notes/ /usr/share/nginx/html/
# Published DSE crops are stored at notes/dse/ (tracked) and mirrored to the
# gitignored _local/dse/ paths that chapter pages reference via
# ../_local/dse/… and _local/dse/… . The copy runs at build time so the
# nginx image contains them without requiring an LLM or pipeline run on deploy.
USER root
RUN mkdir -p /usr/share/nginx/html/_local/dse && cp -r /usr/share/nginx/html/dse/* /usr/share/nginx/html/_local/dse/ 2>/dev/null || true && \
    for book in book2 book4 book5; do mkdir -p /usr/share/nginx/html/$book/_local/dse && cp -r /usr/share/nginx/html/dse/* /usr/share/nginx/html/$book/_local/dse/ 2>/dev/null || true; done && \
    chown -R nginx:nginx /usr/share/nginx/html/_local /usr/share/nginx/html/book2/_local /usr/share/nginx/html/book4/_local /usr/share/nginx/html/book5/_local 2>/dev/null || true
USER nginx

EXPOSE 8080
