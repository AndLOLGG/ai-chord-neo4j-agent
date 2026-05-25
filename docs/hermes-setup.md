# Hermes Setup

## Goal

Expose the existing n8n chord workflow to Hermes through a local MCP server.

## Minimal Architecture

```text
Hermes -> MCP server -> n8n endpoint -> search_cw logic -> Neo4j / ChordsWorld
```

## Why This Path

This is the lowest-risk way to make Hermes the primary agent interface without rewriting the existing n8n workflow logic.

## Current Constraint

The exported `search_cw` workflow starts with `When Executed by Another Workflow`, so it isn't directly callable from Hermes yet.

To connect Hermes cleanly, expose it through one of these n8n options:

1. Preferred:
   Create a tiny webhook wrapper workflow in n8n:
   - `Webhook`
   - `Execute Sub-workflow` -> `search_cw`
   - `Respond to Webhook`

2. Temporary:
   Point the MCP server to an existing n8n endpoint that already returns the `search_cw` result shape.

The MCP server in this repo expects an HTTP endpoint that accepts a POST body with:

```json
{
  "query": "find chords for yellow by coldplay",
  "input": "find chords for yellow by coldplay",
  "chatInput": "find chords for yellow by coldplay"
}
```

And ideally returns JSON with a top-level `response` field.

## Environment Variables

Create a local `.env` or set env vars manually:

```text
N8N_SEARCH_ENDPOINT=http://localhost:5678/webhook/92ea99b2-75e5-4145-b1e7-51c234432cca
N8N_AUTH_HEADER_NAME=
N8N_AUTH_HEADER_VALUE=
```

## Install And Run

```bash
npm install
npm run mcp
```

## Hermes MCP Registration

Register this server in Hermes as a local stdio MCP server that runs:

```bash
node /path/to/ai-chord-neo4j-agent/mcp/server.js
```

Or:

```bash
npm run mcp
```

depending on how Hermes expects local MCP commands to be configured on your machine.

## Expected Tool

The MCP server exposes one tool:

- `search_cw`

It should be the primary tool Hermes uses for chord retrieval.

## Current Working Endpoint

The current working production webhook is:

```text
http://localhost:5678/webhook/92ea99b2-75e5-4145-b1e7-51c234432cca
```

This endpoint was verified with a direct POST request and returns the expected chord payload.
