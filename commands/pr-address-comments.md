---
description: Address PR comments
---

Pull and address unresolved comments on PR #$ARGUMENTS

Review comments:
!`gh pr view $ARGUMENTS --json reviews,comments --jq '.reviews[] | select(.state != "APPROVED") | {author: .author.login, body: .body, state: .state}'`

Thread comments:
!`gh pr view $ARGUMENTS --json comments --jq '.comments[] | {author: .author.login, body: .body, path: .path}'`

For each comment:
1. Understand the concern
2. Make the requested code changes
3. Explain what was changed and why
4. Draft a response for the reviewer
