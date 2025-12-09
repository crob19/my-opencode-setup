---
description: Improve type annotations
---

Improve type annotations in @$ARGUMENTS

For Python (.py files):
- Add missing type hints to function signatures
- Use appropriate types from typing module (List, Dict, Optional, Union, etc.)
- Add return type annotations
- Use TypedDict or dataclasses for structured data
- Fix any pyright/mypy errors
- Run pyright to verify: !`pyright $ARGUMENTS 2>&1 || true`

For TypeScript (.ts, .tsx files):
- Replace `any` with specific types
- Add missing type annotations
- Use union types and type guards appropriately
- Create interfaces or types for complex structures
- Use generics where beneficial
- Leverage utility types (Partial, Pick, Omit, etc.)

Ensure all type improvements maintain code functionality while improving type safety.
