# Static image for the paper2notes site on Cloud Run.
# Monorepo build: context is the repo root (paper2everything), not paper2notes/.
#   docker build -f paper2notes/deploy/cloudrun/Dockerfile .
# Standalone paper2notes checkouts can still build with:
#   docker build -f deploy/cloudrun/Dockerfile paper2notes
FROM nginxinc/nginx-unprivileged:stable-alpine

COPY paper2notes/deploy/cloudrun/nginx.conf /etc/nginx/conf.d/default.conf
# .dockerignore (at repo root) keeps paper2notes/notes/_source and _local out of the image.
COPY paper2notes/notes/ /usr/share/nginx/html/
# Inject / update the deploy-commit footer at image-build time for standalone
# `docker build -f Dockerfile .` without deploy.sh. deploy.sh already injects
# before build and passes --build-arg GIT_COMMIT; this is the fallback. A footer whose
# data-commit already matches is left alone (it carries the commit subject); a stale
# one is rewritten to the new commit ID with the (now wrong) subject dropped.
ARG GIT_COMMIT=local
USER root
RUN short=$(echo "$GIT_COMMIT" | cut -c1-6); \
    if [ -z "$short" ]; then short="local"; fi; \
    echo "injecting deploy commit $short at image build"; \
    find /usr/share/nginx/html -name "*.html" -type f -print0 | while IFS= read -r -d '' f; do \
      if grep -q "data-commit=\"$short\"" "$f"; then \
        :; \
      elif grep -q "deploy-commit-footer" "$f"; then \
        sed -i "s|<span class=\"deploy-commit-subject\">[^<]*</span>||g" "$f"; \
        sed -i "s/data-commit=\"[^\"]*\"/data-commit=\"$short\"/g" "$f"; \
        sed -i "s|deployed commit: <code[^>]*>[^<]*</code>|deployed commit: <code style=\"font:inherit;color:inherit;background:none;border:0;padding:0\">$short</code>|g" "$f"; \
      else \
        sed -i "s|</[Bb][Oo][Dd][Yy][[:space:]]*>|<footer class=\"deploy-commit-footer\" style=\"text-align:center;font-size:0.68rem;color:#9aa0a8;padding:10px 1rem 12px;border-top:1px solid #e9e3d6;margin-top:2rem;font-family:ui-monospace,Menlo,Consolas,monospace\" data-commit=\"$short\">deployed commit: <code style=\"font:inherit;color:inherit;background:none;border:0;padding:0\">$short</code></footer></body>|g" "$f"; \
      fi; \
    done;
# Published DSE crops are stored at notes/dse/ (tracked) and mirrored to the
# gitignored _local/dse/ paths that chapter pages reference via
# ../_local/dse/… and _local/dse/… . The copy runs at build time so the
# nginx image contains them without requiring an LLM or pipeline run on deploy.
RUN mkdir -p /usr/share/nginx/html/_local/dse && cp -r /usr/share/nginx/html/dse/* /usr/share/nginx/html/_local/dse/ 2>/dev/null || true && \
    for book in book2 book4 book5; do mkdir -p /usr/share/nginx/html/$book/_local/dse && cp -r /usr/share/nginx/html/dse/* /usr/share/nginx/html/$book/_local/dse/ 2>/dev/null || true; done && \
    chown -R nginx:nginx /usr/share/nginx/html/_local /usr/share/nginx/html/book2/_local /usr/share/nginx/html/book4/_local /usr/share/nginx/html/book5/_local 2>/dev/null || true
USER nginx

EXPOSE 8080
