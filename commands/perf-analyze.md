---
description: Performance analysis
---

Analyze @$ARGUMENTS for performance issues.

For Python:
- N+1 database query patterns
- Inefficient loops or list comprehensions
- Unnecessary object copies
- Memory leaks (circular references, unclosed files)
- Blocking I/O that should be async
- Inefficient data structures
- Missing database indexes (if ORM queries present)

For TypeScript/React:
- Unnecessary re-renders
- Missing React.memo or useMemo/useCallback
- Large bundle size contributors
- Blocking synchronous operations
- Memory leaks (event listeners, subscriptions)
- Inefficient algorithms

For Terraform:
- Over-provisioned resources
- Inefficient resource configurations
- Missing autoscaling
- Unnecessary data transfer costs

Provide specific recommendations with code examples where applicable.
