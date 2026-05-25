# Hermes Setup

## Goal

Expose the working n8n chord retrieval workflow to Hermes through a local MCP server.

## Current Architecture

    Hermes -> MCP server -> direct n8n webhook -> search_cw_webhook -> Neo4j / ChordsWorld

## Why This Path

This is the lowest-risk way to make Hermes the primary agent interface without relying on Execute Sub-workflow return behavior.

## Current Working Workflow

The repo now uses a direct webhook version of the workflow:

- `search_cw_webhook`

This workflow starts with an n8n `Webhook` node and can be called directly by the MCP server.

## Request Shape

The MCP server POSTs JSON like this:

    {
      "query": "find chords for Yellow by Coldplay"
    }

## Environment Variables

Create a local `.env` or set env vars manually:

    N8N_SEARCH_ENDPOINT=http://localhost:5678/webhook/cc549916-c92c-4fc1-be35-bceb9f72c14e
    N8N_AUTH_HEADER_NAME=
    N8N_AUTH_HEADER_VALUE=

## Install And Run

    npm install
    npm run mcp

## Hermes MCP Registration

Register this server in Hermes as a local stdio MCP server that runs:

    node /mnt/c/Users/andre/IdeaProjects/ai-chord-neo4j-agent/mcp/server.js

Or:

    npm run mcp

## Expected Tool

The MCP server exposes one tool:

- `search_cw`

Hermes should use this as the primary tool for chord retrieval.

## Current Working Endpoint

    http://localhost:5678/webhook/cc549916-c92c-4fc1-be35-bceb9f72c14e

This direct webhook endpoint was verified with a POST request and returns the expected chord payload.
