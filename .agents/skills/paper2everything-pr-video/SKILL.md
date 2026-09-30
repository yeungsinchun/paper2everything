---
name: paper2everything-pr-video
description: Ensure any PR that includes a video renders and plays inline on GitHub by uploading the video as a file attachment (browser drag-drop or gh CLI --attach) and placing the resulting user-attachments URL on its own line in the PR description or PR comment. Covers why external URLs and HTML tags fail, the verified upload flow, and the minimal checklist.
---

# paper2everything PR video - inline rendering via attachment upload

A PR video that does **not** play inline wastes review time.
GitHub only renders a native player when the video was uploaded as a **file attachment**
to the PR description or a PR comment - raw `<video>` tags, `![video](https://example.com/...)`
pointing at an external host, or a bare link to a video elsewhere are sanitized or shown as
a plain link. This skill is the single owner of that contract for `paper2everything`.

## 1. Purpose

Pull requests in this repo often need a short capture of an interaction, animation,
three.js stage, or before/after behaviour. The capture must be reviewable from the
forge without downloading or leaving the PR page - i.e. a playable `<video>` rendered
inline by GitHub's markdown renderer. This skill guarantees inline playback by
forcing the one flow GitHub supports: **upload the file as a PR/issue attachment and
embed the resulting `https://github.com/user-attachments/assets/...` URL**.

## 2. Why external URLs and raw HTML tags do not render inline

GitHub sanitizes PR bodies and comments with a strict allowlist:

- **External video URL in markdown image syntax does not play.** Writing
  `![my video](https://example.com/video.mp4)` or
  `![my video](https://cdn.example.org/clip.webm)` produces a broken image or a
  link, never a player. GitHub only renders a player for URLs whose host is
  `github.com/user-attachments/assets/` (the anonymized URL domain) - i.e. a file
  that went through the GitHub attachment upload path. Verified negative test
  (2026-09-30 on `yeungsinchun/paper2everything#62`): posting
  `![my video](https://example.com/video.mp4)` stays as that markdown string and does
  not become a player in `gh api /repos/yeungsinchun/paper2everything/issues/62/comments --jq .[].body`.
- **Raw HTML `<video>` is stripped.** Posting
  `<video src="https://example.com/video.mp4" controls></video>` or `<source>` /
  `<iframe>` is removed by the HTML sanitizer. The PR shows escaped text or nothing,
  not a player. Same negative test: a comment containing that tag is stored verbatim
  in the API but rendered as inert text on `github.com`, not a player.
- **A bare external link renders as a link, not a player.** `https://example.com/video.mp4`
  becomes a clickable `<a>` that forces a download/redirect away from the PR. It does
  not autoplay or inline-preview.
- **Only anonymized attachment URLs render as inline video.** When GitHub's attachment
  path rewrites your upload to `https://github.com/user-attachments/assets/<uuid>`
  (or `https://github.com/user-attachments/files/<id>/...` in the API) **and** that URL
  sits alone on its own paragraph line, GitHub's renderer emits a native `<video controls>`
  player. If the same URL appears *inside* a sentence, it falls back to a link. This
  is why the upload flow below matters - no upload, no inline player.

References: `https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/attaching-files`
("When you attach a file, it is uploaded immediately to GitHub and the text field is
updated to show the anonymized URL") and
`https://docs.github.com/en/github-cli/github-cli/attaching-files-with-github-cli`
(section "Embedding a video").

Supported attachment types for inline players on this forge (those two docs):
`*.mp4`, `*.mov`, `*.webm` (H.264 / `libx264` recommended - codec support is browser-
dependent). Limits: `10 MB` per video on a free-plan repo, `100 MB` on a paid plan
(this repo is free-plan, so keep captures under 10 MB; 2-5 MB at 720p is ample).
All other file types listed under "Additional file types" (pdf, zip, etc.) never render
as a video player.

## 3. Verified upload flow - file-attachment via the GitHub web attachment endpoint

There is exactly one working path: **file-attachment upload via the GitHub web attachment
endpoint**, which returns a `user-attachments` URL. That endpoint is what the browser's
drag-drop and the CLI's `--attach` flag both call. `gh` has no separate "attachment API"
you can hit with `gh api` or `gh-axi api` - a direct `curl POST https://github.com/upload/policies/assets`
with `Authorization: token $TOKEN` returns `422` (verified 2026-09-30 on this repo;
the token was valid for `gh issue create`). Similarly, `gh-axi` exposes no `--attach`
flag (verified `gh-axi pr comment --help` and `gh-axi api --help` - neither lists it).
Do **not** assume `gh api /repos/{owner}/{repo}/assets` or raw `curl` to the upload
endpoint works - it was tested and fails. Use one of the two verified flows below.

Both flows require **push access** to `yeungsinchun/paper2everything` (the token scope
`repo` - the `gh auth status` token on this worktree has `gist, read:org, repo, workflow`
and can attach). You can attach up to **50 files per command** (CLI).

### 3.1 Browser flow (primary, always works)

Use this when you are already on `github.com` or want the fastest visual confirmation.

1. Open the PR description editor (`New pull request` page) or a PR comment box.
2. **Drag and drop** the local video file onto the textarea, **or** click the
   paperclip icon in the comment toolbar (`Attach files`) and pick the file, **or**
   paste the video from the clipboard (browser-dependent). GitHub shows `Uploading...`
   then replaces the drop with markdown.
3. Wait for the upload to finish. The textarea is updated automatically to a bare URL
   on its own line, e.g. `https://github.com/user-attachments/assets/aab6cfc2-7351-4339-b917-8b401f7958e8`
   (verified pattern on test issue `yeungsinchun/paper2everything#62` and test PR `#55`).
4. Leave that URL **alone on its own paragraph** (blank line before and after).
   Do not wrap it in `[]()` or move it into a sentence - its position controls whether
   you get a player vs a link (see §4).
5. Submit the PR/comment. The PR page renders the URL as a playable player immediately.

This flow uses the same anonymized URL domain the CLI produces; it is the reference
flow GitHub documents. Prefer it for manual PRs.

### 3.2 CLI flow via `gh --attach` (verified, scriptable)

Verified on `gh 2.100.0` (2026-09-03) on this worktree with a real `3.9 KB` H.264
`video/mp4` at `/tmp/test-video-real.mp4` (generated by `ffmpeg -f lavfi -i color=c=black:s=320x240:d=1:r=30 -c:v libx264 -c:a aac`).
The flow was tested end-to-end (create issue, comment with attachment, read back body)
and the resulting body contained a `user-attachments` URL that renders as a player:

```bash
# 1. create a body file that references the local path as a standalone image ref
#    The reference MUST be the only content in its paragraph (blank line before/after)
cat > /tmp/video-body.md <<'EOF'
PR video verification:

![](/tmp/test-video-real.mp4)
EOF

# 2a. Attach on PR creation (body + video together)
gh pr create \
  --title "feat(book2): animate trench - with capture" \
  --body-file /tmp/video-body.md \
  --attach /tmp/test-video-real.mp4

# 2b. Attach on PR edit (add a video to an existing PR description)
gh pr edit 123 --body-file /tmp/video-body.md --attach /tmp/test-video-real.mp4

# 2c. Attach on PR comment (most common for follow-up captures)
gh pr comment 123 --body-file /tmp/video-body.md --attach /tmp/test-video-real.mp4

# 2d. Equivalent for issues (same flag, same behaviour)
gh issue comment 62 --body-file /tmp/video-body.md --attach /tmp/test-video-real.mp4
```

What `gh` does internally (documented at `.../attaching-files-with-github-cli#embedding-a-video`
and observed in the test):

- It uploads the file to the same web attachment endpoint as the browser and receives
  a `https://github.com/user-attachments/assets/<uuid>` URL.
- If the body already contains `![](/tmp/test-video-real.mp4)` (or `![alt](...)` with
  the same local path) as a **standalone paragraph**, `gh` **rewrites** that line in-place
  to `https://github.com/user-attachments/assets/...` (bare URL, blank lines preserved).
  The rewrite is what yields a player - verified by `gh api ... --jq .body` returning
  `Video test ...\n\nhttps://github.com/user-attachments/assets/fa6022fb-6656-44f6-bee1-6d3039df022a`.
- If the body does **not** reference the local path, `gh` appends the URL at the end
  of the body as a bare link on its own line - also a player, but without control of
  placement. Prefer the rewrite form so the video appears where you wrote it.
- Inside a sentence (`See clip ![](path) for...`) the rewrite produces a link, not a
  player. Keep the `![]()` line isolated.

`gh` also supports `--attach '/path/to/img.png#alt text'` for images, but **alt text is
not supported on video** (flag after `#` is ignored for `.mp4/.mov/.webm`).

Negative check: `gh api POST /repos/yeungsinchun/paper2everything/issues/62/comments --field body=...`
does **not** upload attachments; it only stores the literal string you send. To get a
player you must go through `--attach` or the browser.

#### gh-axi note

As of 2026-09-30 `gh-axi` does **not** expose `--attach` (`gh-axi pr comment --help`
shows no such flag). For attachments, run `gh` directly (same token, same repo).
`gh-axi` remains the tool for `pr view/create/edit/close/merge/list` etc.; mix `gh`
for the attachment step and `gh-axi` for the rest in the same checkout - they share
`~/.config/gh`.

### 3.3 What NOT to do

- Do not `curl -X POST https://github.com/upload/policies/assets ...` by hand - it
  was tested here and returns `422` with GitHub's "Your browser did something unexpected"
  page even with a valid `Authorization: Bearer $TOKEN` and `repository_id`. The public
  contract is the browser or `gh --attach`; hand-rolled posts are unsupported and not
  versioned.
- Do not `gh api POST /repos/{owner}/{repo}/issues/{n}/comments ...` with a local
  path string and expect a player - the API stores exactly the string you send, with no
  attachment upload.
- Do not commit the video file into `git` and link to `raw.githubusercontent.com`
  or to a release asset (`/releases/download/...`) - those URLs are `Content-Disposition:
  attachment` or `raw` and never render as inline players in a PR body.

## 4. How to put the resulting URL in the PR description or PR comment so it renders as a playable video

After §3 you already have a bare `user-attachments` URL. Placement is what turns it into
a player:

- **Correct - bare URL on its own paragraph (player):**
  ```markdown
  ## Capture - trench animation (Book 2 ch01)

  Before/after capture shows the centered stage and unstacked hud-labels:

  https://github.com/user-attachments/assets/8c2dceec-9b34-40bb-821a-799e8858d291

  Steps captured at 1280x800 headed via chrome-devtools-axi.
  ```
  This renders as a native player with controls, scrub bar, and fullscreen.

- **Correct - via rewritten markdown (also player):**
  If you used `gh --attach` with a body file that contained `![](/tmp/clip.mp4)` as the
  sole line of a paragraph, the body after upload is the same bare URL on its own line.
  No extra editing needed.

- **Wrong - inside a sentence (link only):**
  ```markdown
  See https://github.com/user-attachments/assets/xxx for the clip.
  ```
  This renders as a plain `<a>` link. Move the URL to its own paragraph with blank
  lines before and after.

- **Wrong - markdown image pointing at attachment (still player but fragile):**
  `![video](https://github.com/user-attachments/assets/xxx)` is not needed and can
  break player heuristics. Prefer the bare URL form `gh` produces.

Practical recipe for this repo (PR description or PR comment - same rule, both
render players):

```bash
# If using the browser: drag-drop the .mp4 onto the PR body/comment box,
# ensure the resulting URL is on its own line, submit.

# If using the CLI: keep the reference on its own line in the body file,
# then attach the same file:
cat > /tmp/pr-video.md <<'EOF'
## Video - Book 2 ch01 trench animation

Capture of the centered 720px stage and unstacked hud-labels. H.264 720p, ~3 MB:

![](/tmp/book2-ch01-trench.mp4)
EOF

gh pr create --title "fix(book2-ch01): ..." --body-file /tmp/pr-video.md --attach /tmp/book2-ch01-trench.mp4
# or
gh pr comment 123 --body-file /tmp/pr-video.md --attach /tmp/book2-ch01-trench.mp4
```

Verify the body that hit the forge actually contains the anonymized URL and not the
local path:

```bash
gh pr view 123 --json body --jq .body          # or --full for comments
gh api /repos/yeungsinchun/paper2everything/issues/123/comments --jq '.[-1].body'
# Expect to see ...\n\nhttps://github.com/user-attachments/assets/<uuid>\n\n...
```

Second verification is visual: open the PR URL printed by `gh pr create` (e.g.
`https://github.com/yeungsinchun/paper2everything/pull/123`) in a browser and confirm
a native player appears with controls (play/pause, scrub, volume, fullscreen) and that
the video plays - not just a link. `gh` cannot "see" the rendered player, so the check
is two-part: API shows the `user-attachments` URL on its own line, and the browser
shows a player.

## 5. When to invoke

Load and follow this skill **before** `gh pr create` / `gh pr edit` / `gh pr comment`
(and before editing a PR body in the browser) in any of these cases:

- The PR description or any PR comment will include a video, screen capture, or
  animation (e.g. three.js stage `diagrams3d.js`, Book 2/4/5 visual, responsive
  layout change, before/after motion).
- You are asked to "add a video to the PR" or to "show the interaction".
- A reviewer asks for a clip because a screenshot is insufficient (motion, timing,
  hover/focus).

If the PR has no video, this skill does not apply.

## 6. Verification checklist (paste into PR body or keep locally)

This is the gate reviewers should check. Every box must be ticked when the PR claims
a video.

```markdown
## PR video checklist

- [ ] Video uploaded as GitHub file attachment via browser drag-drop/paperclip or via `gh --attach` (not via external URL, not via raw <video>/<iframe> HTML)
- [ ] PR body or PR comment contains the resulting `https://github.com/user-attachments/assets/...` URL and that URL is on its own paragraph with blank lines before/after (player, not link)
- [ ] Attachment is a supported media type (`.mp4` / `.mov` / `.webm`, H.264 recommended) and under the size limit (10 MB on this free-plan repo, 100 MB on paid)
- [ ] CLI path verified with `gh api /repos/.../issues/<n>/comments --jq .body` showing the `user-attachments` URL, not the local path; visual path verified in the browser - PR page shows a native player that plays with controls
```

A PR that mentions a video but has any box unchecked **fails review** - request changes
with "video not uploaded as GitHub attachment - see `.agents/skills/paper2everything-pr-video/SKILL.md` §6".

## 7. Dry-run validation (proves the skill works on this repo)

Dry-run A - reproduce the failing path (external URL / HTML must NOT give a player):

```bash
cat > /tmp/bad-video-body.md <<'EOF'
![my video](https://example.com/video.mp4)
<video src="https://example.com/video.mp4" controls></video>
https://example.com/video.mp4
EOF
# Post that body with gh issue comment (no --attach) to a dummy issue 62:
gh issue comment 62 --body-file /tmp/bad-video-body.md
gh api /repos/yeungsinchun/paper2everything/issues/62/comments --jq '.[-1].body'
# Stored body is exactly the strings above, rendered as link/text, not a player → FAIL expected.
```

Dry-run B - prove the happy path (attachment → player). This was the live verified
test run on 2026-09-30 with `gh 2.100.0`:

```bash
# Prepare a local video (H.264 mp4, 320x240, 1s, ~4 KB):
ffmpeg -y -f lavfi -i color=c=black:s=320x240:d=1:r=30 -f lavfi -i anullsrc -c:v libx264 -c:a aac -shortest /tmp/test-video-real.mp4

# Body file with the local path on its own paragraph:
cat > /tmp/video-body.md <<'EOF'
PR video dry-run:

![](/tmp/test-video-real.mp4)
EOF

gh issue create --title "test: verify video attachment upload for skill" \
  --body "Test issue for verifying video attachment flow" \
  --attach /tmp/test-video-real.mp4
# → https://github.com/yeungsinchun/paper2everything/issues/62
gh api /repos/yeungsinchun/paper2everything/issues/62 --jq .body
# → ...\n\nhttps://github.com/user-attachments/assets/aab6cfc2-7351-4339-b917-8b401f7958e8

gh issue comment 62 --body-file /tmp/video-body.md --attach /tmp/test-video-real.mp4
gh api /repos/yeungsinchun/paper2everything/issues/62/comments --jq '.[-1].body'
# → ...\n\nhttps://github.com/user-attachments/assets/fa6022fb-6656-44f6-bee1-6d3039df022a

gh pr comment 55 --body-file /tmp/video-body.md --attach /tmp/test-video-real.mp4
gh api /repos/yeungsinchun/paper2everything/issues/55/comments --jq '.[-1].body'
# → ...\n\nhttps://github.com/user-attachments/assets/8c2dceec-9b34-40bb-821a-799e8858d291

# Visual confirmation: open the issue/PR URLs in a browser - each bare
# user-attachments URL renders as a native <video controls> player that plays.
# (gh itself cannot render video - browser is required.)

# Cleanup (issue 62 test data):
gh issue close 62 --reason "not planned"
# (comments can be deleted via DELETE /repos/{owner}/{repo}/issues/comments/{id} if needed)
```

Expected gate: a PR whose body contains an external `https://.../video.mp4` or a
`<video>` tag but no `https://github.com/user-attachments/assets/...` on its own line
**must** be returned with "video not uploaded as GitHub attachment - see
`.agents/skills/paper2everything-pr-video/SKILL.md` §6". The same PR after re-posting
with the attachment flow above **must** pass: API body shows the anonymized URL on its
own paragraph and the browser shows a playable player.

Note for local validation without polluting the forge: run the above on a throwaway
issue (as shown) and delete/close it after confirming - the skill's flow is still
proved by the real PR/comment you ship.

## 8. Discoverability and relation to other skills

- This skill is discoverable via `ls .agents/skills/` → `.agents/skills/paper2everything-pr-video/SKILL.md`.
- `paper2everything-ui-screenshot` governs screenshot proof for UI PRs; this skill
  governs video proof. A PR may need both (screenshot pair + inline video). The two
  checklists are independent and must both pass when both artefacts are present.
- `paper2notes/.agents/skills/lavish-notes-review` governs before/after board layout;
  videos do not replace Lavish boards when the change is a chapter refactor - add the
  board alongside the clip.
- `docs/ARCHITECTURE.md` maps the data edge; this skill does not change architecture.

This skill adds no CI mutations, no PR dismissals, and no code changes beyond the
attachment guidance itself. It is the sole contract for inline video on PRs in
`paper2everything`.
