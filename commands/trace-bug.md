---
description: Trace bug through codebase
---

Trace a bug through the codebase and identify the root cause.

Bug description/error message: $ARGUMENTS

Steps:
1. Understand the error message and stack trace
2. Identify the entry point of the issue
3. Trace the execution path through the code
4. Find where the unexpected behavior originates
5. Identify related code that might be affected
6. Suggest a fix with explanation

For Python:
- Check for common issues: None checks, type mismatches, import errors
- Look at exception stack traces carefully
- Consider async/await issues if applicable

For TypeScript:
- Check for undefined/null issues
- Look at type errors
- Consider promise handling and async issues
- Check for missing error boundaries (React)

Provide:
- Root cause explanation
- Specific file locations (file:line)
- Suggested fix with code examples
- Any related issues that should be addressed
