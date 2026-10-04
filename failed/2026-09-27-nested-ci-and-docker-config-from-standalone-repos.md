# Nested CI and docker config copied in from the standalone repos

Abandoned on 2026-09-27. Recorded 2026-10-04.

## Purpose

Run the notes and mock checks from each project's own GitHub Actions
definition after `paper2notes`, `paper2db` and `paper2mock` were merged into
one repository.

## What was tried

Commit 3cb5442 (inside the monorepo build pull request
https://github.com/yeungsinchun/paper2everything/pull/1) plain-copied the three
standalone repositories, so each one brought its own root dotfiles with it:

- `paper2notes/.github/workflows/ci.yml`
- `paper2notes/.github/workflows/deploy.yml`
- `paper2mock/.github/workflows/compile-mocks.yml`
- `paper2notes/.dockerignore`

## Model and runtime used

No model is named. The files are GitHub Actions YAML and one `.dockerignore`.
They were copied as plain files, not authored here.

## Data or corpus it consumed

No data. The only input was the working trees of the `paper2notes` and
`paper2mock` repositories.

## Why it was abandoned or superseded

GitHub Actions reads workflow files only from the repository root
`.github/workflows/`. The nested copies live one or two folders deeper, so they
never ran. The same pull request namespaced the real workflows at the root as
`ci-notes.yml`, `deploy-notes.yml` and `compile-mocks.yml`, with monorepo path
filters. The root `compile-mocks.yml` is what later work edited: pull request
https://github.com/yeungsinchun/paper2everything/pull/68 changed only
`.github/workflows/compile-mocks.yml`.

`docs/PRD.md` section 12 lists the nested files as dead config. The last line of
that entry is still open: `.github/workflows/ci-notes.yml` path-filters on
`paper2notes/.github/workflows/**`, a path that only the dead copy writes to, so
an edit to a dead file still triggers the notes check.

`docs/ARCHITECTURE.md` records the same for `paper2notes/.dockerignore`: the
root `.dockerignore` applies instead.

## What replaced it

The namespaced workflows at the repository root, added in the same pull
request:

- `.github/workflows/ci-notes.yml`
- `.github/workflows/deploy-notes.yml`
- `.github/workflows/compile-mocks.yml`
- root `.dockerignore`

## Link to the replacement PR or issue

https://github.com/yeungsinchun/paper2everything/pull/1
(the namespace step in that pull request; confirmed by
https://github.com/yeungsinchun/paper2everything/pull/68)

## Note on current state

All four files are still tracked on `main` as of this record. They are dead
weight, not dead references that fail. The path filter in `ci-notes.yml` is the
one live consequence left behind.