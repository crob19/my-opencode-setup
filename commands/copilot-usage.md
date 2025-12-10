---
description: Check GitHub Copilot usage
---

Check your GitHub Copilot billing usage and costs for the current month (or specified period).

Arguments from user input (if provided):
- First argument: "personal" or organization name (e.g., "clippd")
- --month: Month number (1-12) for historical data
- --year: Year (e.g., 2024) for historical data
- --verbose: Show detailed SKU breakdown

Step 1: Determine the target account
- If user provided "personal" → use personal account
- If user provided an org name → use that organization
- Otherwise, auto-detect:
  - Check if in a git repository: !`git remote get-url origin 2>/dev/null || echo ""`
  - If remote exists, extract org/owner from URL
  - Check if it's an org: !`gh api /user/orgs --jq '.[].login'`
  - If org detected → use org account
  - Otherwise → use personal account

Step 2: Get authenticated username
!`gh api /user --jq '.login'`

Step 3: Determine time period parameters
- Default: current month and year
- If --month or --year provided, use those values
- Format: ?year=YYYY&month=MM (only include if specified)

Step 4: Fetch billing data based on account type

For PERSONAL account:
- Try: !`gh api /users/{username}/settings/billing/usage/summary{?year,month,product=copilot}`
- If 404 with scope error, tell user: "Run: gh auth refresh -h github.com -s user"
- Also fetch premium requests: !`gh api /users/{username}/settings/billing/premium_request/usage{?year,month,product=copilot}`

For ORGANIZATION account:
- Try: !`gh api /organizations/{org}/settings/billing/usage/summary{?year,month,product=copilot}`
- If 404 with scope error, tell user: "Run: gh auth refresh -h github.com -s admin:org"
- Also fetch premium requests: !`gh api /organizations/{org}/settings/billing/premium_request/usage{?year,month,product=copilot}`
- Fetch seat information: !`gh api /orgs/{org}/copilot/billing`
- Note: Seat endpoint may need different scopes

Step 5: Format and display the results

Display format:
```
GitHub Copilot Usage Report
Account: [Personal: username] or [Organization: orgname]
Period: [Month Year] or [Year] (depending on query)

[If Organization] Seat Information:
- Total seats: X
- Active this cycle: X
- Inactive this cycle: X
- Pending cancellation: X
- Plan type: [business/enterprise]

Copilot Usage:
[For each usage item from usageItems array]
- Product: [product name]
  SKU: [sku]
  Quantity: [grossQuantity] [unitType]
  [If --verbose] Price per unit: $[pricePerUnit]
  [If --verbose] Gross amount: $[grossAmount]
  [If discountAmount > 0] Discount: -$[discountAmount]
  Net cost: $[netAmount]

[If premium request data exists]
Premium Request Usage (Advanced Models):
[For each usage item]
- Model: [model]
  Requests: [grossQuantity]
  [If --verbose] Price per request: $[pricePerUnit]
  [If discountAmount > 0] Discount: -$[discountAmount]
  Net cost: $[netAmount]

Total Net Cost: $[sum of all netAmount values]
```

Error handling:
- If 404 Not Found → Check if enhanced billing platform is enabled or if Copilot is active
- If empty usageItems → Display "No Copilot usage for this period"
- If API returns error → Display the error message clearly
- If not in git repo and no argument provided → Default to personal account

Present the data in a clear, easy-to-read format. If --verbose flag is not set, show a summary view. If --verbose is set, include all pricing details and SKU breakdowns.
