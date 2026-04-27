# User Guide

## Installation

### Prerequisites

- A supported coding CLI (Claude Code, Gemini CLI, Codex, or OpenCode)
- Node.js 20 or later

### Setup

```bash
geno-tools install geno-vla
```

Or from within an agent session:

```
/geno-tools install geno-vla
```

The install clones the repo, runs `npm install`, builds the TypeScript, and installs Playwright's Chromium. The MCP entry point is `dist/cli.js`.

## Configuring the MCP Server

Add geno-vla to your agent's MCP configuration (e.g. `~/.claude/mcp.json`, `.mcp.json`, or your agent's equivalent).

### Headless mode (default)

```json
{
  "mcpServers": {
    "geno-vla": {
      "command": "node",
      "args": ["/absolute/path/to/geno-vla/dist/cli.js"]
    }
  }
}
```

### Visible browser window

Add `--headless=false` to see the browser as geno-vla controls it. Useful for debugging and development.

```json
{
  "mcpServers": {
    "geno-vla": {
      "command": "node",
      "args": ["/absolute/path/to/geno-vla/dist/cli.js", "--headless=false"]
    }
  }
}
```

After configuring, restart your coding agent. The geno-vla tools will appear in the available tool list.

---

## Tools

### geno_navigate

Navigate to a URL. Waits for the page to load and returns the page state as an ARIA snapshot.

**Parameters:**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `url` | string | (required) | URL to navigate to |
| `waitUntil` | enum | `"domcontentloaded"` | When to consider navigation complete. Options: `"commit"` (fastest), `"domcontentloaded"`, `"load"`, `"networkidle"` (most thorough) |

**Example:**

```
Navigate to https://github.com/42euge/geno-vla
```

The agent will call `geno_navigate` with `url: "https://github.com/42euge/geno-vla"` and receive the full page state -- URL, title, HTTP status, and ARIA snapshot -- in a single response.

**What it handles internally:**

1. Sends the navigation request to Playwright
2. Waits for the specified load state
3. Additionally waits for `domcontentloaded` to ensure stability
4. Takes an ARIA snapshot of the page
5. Returns URL, title, status code, and the snapshot

---

### geno_interact

Interact with a page element. Automatically waits for the element to be visible and actionable, performs the action, then returns the updated page state.

**Parameters:**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `action` | enum | (required) | One of: `"click"`, `"type"`, `"select"`, `"check"`, `"uncheck"`, `"hover"`, `"focus"` |
| `selector` | string | (required) | Playwright selector (CSS, `role=`, `text=`, etc.) |
| `value` | string | (optional) | Value for `type` and `select` actions |
| `clearFirst` | boolean | `false` | Clear existing value before typing (only for `type`) |

**Examples:**

Click a button:
```
Click the "Sign In" button on the page
```
The agent calls `geno_interact` with `action: "click"`, `selector: "role=button[name='Sign In']"`.

Type into a field:
```
Type "hello world" into the search box
```
The agent calls `geno_interact` with `action: "type"`, `selector: "input[name='q']"`, `value: "hello world"`.

**What it handles internally:**

1. Locates the element using the provided selector
2. Waits up to 10 seconds for it to become visible
3. Performs the action (click, type, select, etc.)
4. Waits for any triggered navigation to settle
5. Waits 100ms for JS-driven UI updates
6. Takes an ARIA snapshot and returns the updated state

---

### geno_observe

Observe the current page state. Returns an ARIA snapshot and optionally includes a screenshot for visual verification.

**Parameters:**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `includeScreenshot` | boolean | `false` | Include a PNG screenshot in the response |
| `selector` | string | (optional) | Scope observation to a specific element |
| `fullPage` | boolean | `false` | Take a full-page screenshot (only when `includeScreenshot` is true) |

**Examples:**

Get page state:
```
What's on the current page?
```
The agent calls `geno_observe` with defaults and receives the ARIA snapshot.

Get a screenshot of a specific element:
```
Show me a screenshot of the navigation bar
```
The agent calls `geno_observe` with `includeScreenshot: true`, `selector: "nav"`.

---

### geno_fill_form

Fill an entire form in one call. Provide all field selectors and values, and optionally submit the form.

**Parameters:**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `fields` | array | (required) | List of `{ selector, value, action }` objects |
| `fields[].selector` | string | (required) | Playwright selector for the form field |
| `fields[].value` | string | (required) | Value to fill in |
| `fields[].action` | enum | `"type"` | One of: `"type"`, `"select"`, `"check"`, `"uncheck"` |
| `submit` | string | (optional) | Selector for the submit button |

**Example:**

```
Fill the login form with username "alice" and password "secret123", then submit
```

The agent calls `geno_fill_form` with:
```json
{
  "fields": [
    { "selector": "input[name='username']", "value": "alice" },
    { "selector": "input[name='password']", "value": "secret123" }
  ],
  "submit": "button[type='submit']"
}
```

**What it handles internally:**

1. For each field: locates it, waits for visibility, clears existing value (for type), fills with the provided value
2. If a submit selector is provided: clicks the submit button
3. Waits for navigation/response to settle after submit
4. Takes an ARIA snapshot and returns the final state

---

### geno_extract

Extract structured data from the page by evaluating a JavaScript expression in the browser context.

**Parameters:**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `expression` | string | (required) | JavaScript expression to evaluate. Must return a serializable value. |

**Examples:**

Extract page metadata:
```
Get the page title and all heading texts
```

The agent calls `geno_extract` with:
```json
{
  "expression": "({ title: document.title, headings: [...document.querySelectorAll('h1, h2, h3')].map(h => h.textContent.trim()) })"
}
```

Extract table data:
```
Extract the data from the pricing table
```

The agent calls `geno_extract` with a JS expression that reads the table rows and returns them as an array of objects.

---

## Common Workflows

### Navigate and interact

A typical flow: navigate to a page, then interact with elements on it.

1. `geno_navigate` to the target URL -- returns page state
2. `geno_interact` to click/type/select -- returns updated state
3. Repeat `geno_interact` as needed

Each step returns the full page state, so the agent always knows what is on the page without extra observe calls.

### Form filling

Use `geno_fill_form` to fill all fields and submit in a single call. This is far more efficient than individual `geno_interact` calls for each field.

### Data extraction

1. `geno_navigate` to the page with the data
2. `geno_extract` with a JS expression to pull structured data
3. Use the returned JSON directly

---

## CLI Options

| Option | Description |
|---|---|
| `--headless=false` | Run with a visible browser window. Defaults to headless. |

---

## Troubleshooting

### "Browser not launched" error

The browser must be launched before any tool can be used. This happens automatically when the MCP server starts. If you see this error, the server failed to start properly. Check that Playwright and Chromium are installed:

```bash
npx playwright install chromium
```

### Element not found / timeout

`geno_interact` and `geno_fill_form` wait up to 10 seconds (5 seconds for form fields) for elements to become visible. If the element does not appear in time, the call fails. Common causes:

- Incorrect selector -- use `geno_observe` first to see the current page state and identify correct selectors
- Element is inside an iframe -- Playwright selectors do not cross iframe boundaries by default
- Element requires scrolling -- try `geno_interact` with `action: "hover"` first to scroll it into view

### No ARIA snapshot data

Some pages with heavy JavaScript rendering may produce empty or minimal ARIA snapshots. Use `geno_observe` with `includeScreenshot: true` to get a visual representation instead.

### Server does not appear in agent session

1. Verify the path in your MCP config points to the built `dist/cli.js` file
2. Make sure you ran `npm run build`
3. Restart your coding agent after changing MCP configuration
