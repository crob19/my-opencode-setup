---
description: Security audit
---

Perform a security audit of @$ARGUMENTS

Check for:

Python:
- SQL injection (raw queries, string formatting in SQL)
- Command injection (subprocess with shell=True, os.system)
- Path traversal (os.path.join with user input)
- Pickle/YAML deserialization vulnerabilities
- Hardcoded secrets or credentials
- Insecure random number generation
- XML/XXE vulnerabilities

TypeScript/JavaScript:
- XSS vulnerabilities (dangerouslySetInnerHTML, eval)
- SQL injection in database queries
- Command injection (child_process.exec)
- Path traversal
- Prototype pollution
- Hardcoded secrets or API keys
- CSRF vulnerabilities
- Insecure dependencies

Terraform:
- Hardcoded secrets in configuration
- Overly permissive IAM policies
- Publicly accessible resources
- Missing encryption
- Lack of logging/monitoring

General:
- Authentication/authorization issues
- Sensitive data in logs
- Missing input validation
- Rate limiting gaps

Report findings with severity levels and remediation steps.
