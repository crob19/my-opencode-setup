---
description: Generate smart commit message
---

Analyze staged changes and suggest a conventional commit message.

Staged changes:
!`git diff --staged`

Generate a commit message following conventional commits format:
- Type: feat/fix/docs/refactor/test/chore/style/perf
- Scope (optional): affected component/module
- Description: concise summary in imperative mood
- Body (if needed): detailed explanation

Format: type(scope): description

Explain your reasoning for the commit type and description.
