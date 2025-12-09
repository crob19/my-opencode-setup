---
description: Generate tests for file
---

Generate comprehensive tests for @$ARGUMENTS

For Python (.py files):
- Use pytest framework
- Create fixtures as needed
- Mock external dependencies
- Use descriptive test names (test_should_do_something_when_condition)
- Include docstrings explaining test purpose

For TypeScript (.ts, .tsx, .js, .jsx files):
- Use vitest framework
- Mock external dependencies with vi.mock()
- Use describe/it blocks for organization
- Include both unit and integration test examples

For both:
- Cover happy path scenarios
- Test edge cases and boundary conditions
- Test error handling and exceptions
- Aim for high code coverage
- Include setup and teardown as needed

Place tests in the appropriate location following project conventions.
