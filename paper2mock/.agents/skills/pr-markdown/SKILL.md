---
name: pr-markdown
description: Use when writing or editing a PR title, description, or comment in this repo. Ensures PR-description markdown renders correctly around HTML blocks and images.
---

# PR markdown

Two blank-line rules for PR titles, descriptions, and comments.

## 1. Blank line after a closing HTML block tag

Put a blank line after any closing HTML block tag such as `</details>`
before any markdown content. Without it, the following markdown renders
as raw text instead of formatted content.

## 2. Blank line between consecutive image lines

Put a blank line between consecutive `![...](...)` image lines.
Without it, the images do not each render.

## Wrong

```
</details>
![Question-paper Helvetica cover](https://github.com/user-attachments/assets/37ab0080-2b34-4831-b29d-380c5482297b)
![Question-paper Times-compatible body](https://github.com/user-attachments/assets/74b80e46-6816-461a-b801-4505c3460482)
![Marking-scheme Helvetica cover](https://github.com/user-attachments/assets/285f3f36-0138-4805-9d46-edc6ca5f4855)
![Marking-scheme Times-compatible body](https://github.com/user-attachments/assets/09711f49-726f-4942-ab20-ae73132cf201)
```

Image lines placed directly after a closing `</details>` tag render as
raw text instead of images.

## Right

```
</details>

![Question-paper Helvetica cover](https://github.com/user-attachments/assets/37ab0080-2b34-4831-b29d-380c5482297b)

![Question-paper Times-compatible body](https://github.com/user-attachments/assets/74b80e46-6816-461a-b801-4505c3460482)

![Marking-scheme Helvetica cover](https://github.com/user-attachments/assets/285f3f36-0138-4805-9d46-edc6ca5f4855)

![Marking-scheme Times-compatible body](https://github.com/user-attachments/assets/09711f49-726f-4942-ab20-ae73132cf201)
```
