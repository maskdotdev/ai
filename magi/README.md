# Vertex Agent TUI (Bun + OpenTUI)

Terminal chat agent using the Google Gen AI SDK with Vertex AI, based on the Node.js quickstart pattern.

## Prerequisites

- Bun installed
- A Google Cloud project with Vertex AI enabled (for Vertex mode)
- Application Default Credentials if using Vertex ADC:

```bash
gcloud auth application-default login
```

## Install

```bash
bun install
```

## Configure (Vertex AI quickstart style)

```bash
export GOOGLE_GENAI_USE_VERTEXAI=true
export GOOGLE_CLOUD_PROJECT="your-project-id"
export GOOGLE_CLOUD_LOCATION="us-central1"
# optional
export GENAI_MODEL="gemini-2.5-flash"
```

Alternative auth modes:

```bash
# Gemini Login with Google (same route as Gemini CLI Code Assist)
export GOOGLE_GENAI_USE_GCA=true
# optional: force manual auth-code flow
export GOOGLE_LOGIN_USE_BROWSER=false

# Gemini API key mode
export GEMINI_API_KEY="your-gemini-api-key"

# Compute ADC mode (Cloud Shell / metadata ADC environments)
export GEMINI_CLI_USE_COMPUTE_ADC=true
```

## Run

```bash
bun run start
```

or watch mode:

```bash
bun run dev
```

## Commands inside the TUI

- `/help` show commands
- `/auth [google|vertex|gemini|compute|auto]` choose authentication method
- `/connect` authenticate + reconnect session (defaults to Login with Google)
- `/model <name>` switch model and reset conversation
- `/system <instruction>` set system instruction and reset conversation
- `/clear` clear transcript and reset conversation
- `/exit` quit

Quick login flow (no env required):

1. Start app: `bun run start`
2. In the TUI: `/connect`

Session persistence:

- The app persists your last selected auth mode, model, and system instruction.
- After a successful connection, startup will auto-reconnect on next launch (no manual `/connect` needed in normal cases).
- State is stored at `~/.local/state/magi/session.json` by default.
- Override path with `MAGI_STATE_PATH=/custom/path/session.json`.

## Notes

- `/connect` defaults to Login with Google unless you switch with `/auth ...`.
- Google login uses browser OAuth by default with an in-app consent modal.
- To force manual auth-code flow, set `GOOGLE_LOGIN_USE_BROWSER=false` (or `NO_BROWSER=true`).
- Auth detection precedence matches Gemini CLI env logic:
  1. `GOOGLE_GENAI_USE_GCA=true` (Login with Google)
  2. `GOOGLE_GENAI_USE_VERTEXAI=true`
  3. `GEMINI_API_KEY`
  4. `CLOUD_SHELL=true` or `GEMINI_CLI_USE_COMPUTE_ADC=true`
- For Vertex AI with ADC, run:

```bash
gcloud auth application-default login
```
