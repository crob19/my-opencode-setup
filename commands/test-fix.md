---
description: Run tests and fix failures
---

Run the test suite and fix any failures.

For Python projects:
!`pytest -v 2>&1 || true`

For TypeScript projects:
!`yarn test 2>&1 || true`

Analyze test failures and:
1. Identify the root cause of each failure
2. Determine if it's a test issue or code issue
3. Fix the underlying problem
4. Explain what was wrong and how it was fixed
5. Run tests again to confirm fixes

If tests pass, report success and any observations about test coverage or quality.
