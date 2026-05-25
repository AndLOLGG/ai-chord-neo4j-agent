import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const endpoint = process.env.N8N_SEARCH_ENDPOINT;
const authHeaderName = process.env.N8N_AUTH_HEADER_NAME || "";
const authHeaderValue = process.env.N8N_AUTH_HEADER_VALUE || "";

if (!endpoint) {
  throw new Error("Missing N8N_SEARCH_ENDPOINT. Set it before starting the MCP server.");
}

const server = new McpServer({
  name: "ai-chord-neo4j-agent",
  version: "0.1.0"
});

server.tool(
  "search_cw",
  "Search stored chord data and fallback-ingest missing songs through the n8n workflow.",
  {
    query: z.string().min(1, "Query is required.")
  },
  async ({ query }) => {
    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json"
    };

    if (authHeaderName && authHeaderValue) {
      headers[authHeaderName] = authHeaderValue;
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({
        query,
        input: query,
        chatInput: query
      })
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`n8n request failed (${response.status}): ${body}`);
    }

    const contentType = response.headers.get("content-type") || "";

    if (!contentType.includes("application/json")) {
      const text = await response.text();
      return {
        content: [
          {
            type: "text",
            text
          }
        ]
      };
    }

    const payload = await response.json();

    const text =
      payload?.response ||
      payload?.data?.response ||
      payload?.message ||
      JSON.stringify(payload, null, 2);

    return {
      content: [
        {
          type: "text",
          text
        }
      ]
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
