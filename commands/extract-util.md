---
description: Extract reusable utility
---

Extract repeated code into a reusable utility function.

Context: $ARGUMENTS

Steps:
1. Identify the repeated code pattern
2. Determine the appropriate abstraction level
3. Create a well-named utility function with clear parameters
4. Add comprehensive documentation
5. Update all locations to use the new utility
6. Ensure tests cover the new utility function

For Python:
- Place utility in appropriate module (utils.py or domain-specific module)
- Add type hints
- Include docstring with examples

For TypeScript:
- Place utility in appropriate utils file
- Add full TypeScript types
- Include JSDoc with usage examples

Consider:
- Function naming (should be clear and descriptive)
- Parameter design (flexible but not over-engineered)
- Error handling
- Edge cases
