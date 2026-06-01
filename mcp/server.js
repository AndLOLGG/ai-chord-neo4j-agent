import dotenv from "dotenv";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

dotenv.config({ path: path.join(repoRoot, ".env") });

const endpoint = process.env.N8N_SEARCH_ENDPOINT;
const vectorEndpoint = process.env.N8N_VECTOR_SEARCH_ENDPOINT;
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
    const rawText = await response.text();

    if (!rawText.trim()) {
      throw new Error("n8n returned an empty response body.");
    }

    if (!contentType.includes("application/json")) {
      return {
        content: [
          {
            type: "text",
            text: rawText
          }
        ]
      };
    }

    let payload;

    try {
      payload = JSON.parse(rawText);
    } catch (error) {
      throw new Error(`n8n returned invalid JSON: ${error.message}`);
    }

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

server.tool(
  "similar_songs",
  "Find similar songs using the Neo4j vector index through the n8n workflow.",
  {
    query: z.string().min(1, "Query is required.")
  },
  async ({ query }) => {
    if (!vectorEndpoint) {
      throw new Error(
        "Missing N8N_VECTOR_SEARCH_ENDPOINT. Set it before using similar_songs."
      );
    }

    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json"
    };

    if (authHeaderName && authHeaderValue) {
      headers[authHeaderName] = authHeaderValue;
    }

    const response = await fetch(vectorEndpoint, {
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
      throw new Error(`n8n vector request failed (${response.status}): ${body}`);
    }

    const contentType = response.headers.get("content-type") || "";
    const rawText = await response.text();

    if (!rawText.trim()) {
      throw new Error("n8n vector workflow returned an empty response body.");
    }

    if (!contentType.includes("application/json")) {
      return {
        content: [
          {
            type: "text",
            text: rawText
          }
        ]
      };
    }

    let payload;

    try {
      payload = JSON.parse(rawText);
    } catch (error) {
      throw new Error(`n8n vector workflow returned invalid JSON: ${error.message}`);
    }

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
