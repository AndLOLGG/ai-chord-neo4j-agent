# Project Instructions

This project is an AI chord retrieval system.

For any user request about:

- chords
- songs
- song structure
- capo
- artist + title lookup
- ChordsWorld URLs

you must use the MCP tool from the `ai_chord_neo4j` server.

Do not use browser tools, web tools, or other external lookup paths for these requests.

Do not navigate to websites to find fallback answers.

Do not answer from general model knowledge.

Use the MCP tool result as the single source of truth.

If the MCP tool returns a result, answer from that result only.

If the MCP tool says the song is not found or returns no usable result, say that the song was not found in the current workflow-backed corpus and stop there.

Do not continue with browser fallback.

Keep chord answers short, clean, and readable.
