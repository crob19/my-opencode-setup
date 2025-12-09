---
description: Analyze error logs
---

Analyze error logs or stack trace and suggest fixes.

Error/log output: $ARGUMENTS

Analysis steps:
1. Parse the error message and identify the error type
2. Examine the stack trace to find the failure point
3. Identify the root cause (not just the symptom)
4. Check for related issues in the codebase
5. Suggest specific fixes

For Python errors:
- AttributeError: Check for None values, missing attributes
- TypeError: Check argument types, function signatures
- ImportError/ModuleNotFoundError: Check dependencies, paths
- KeyError: Check dictionary access, missing keys
- IndexError: Check list bounds

For TypeScript errors:
- TypeError: Check for undefined/null, type mismatches
- ReferenceError: Check variable scope and initialization
- Promise rejections: Check async/await, error handling
- Network errors: Check API endpoints, CORS, auth

For Terraform errors:
- Validation errors: Check syntax and required fields
- Provider errors: Check authentication and permissions
- Resource conflicts: Check for duplicate resources or naming

Provide:
- Clear explanation of what went wrong
- Specific file and line references
- Code fix examples
- Prevention strategies
