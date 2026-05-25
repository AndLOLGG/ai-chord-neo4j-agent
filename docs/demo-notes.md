# Demo Notes

## Suggested Demo Flow

1. Start in Hermes Agent.
2. Ask for a song already stored in Neo4j.
3. Show that the response returns title, artist, capo, and sections.
4. Ask for a missing song and show fallback ingestion through `search_cw`.
5. Show one vector-oriented query if available.

## Safe Demo Queries

- `Find chords for Yellow by Coldplay`
- `Find chords for Blank Space by Taylor Swift`
- `Find chords for Streets of Minneapolis by Bruce Springsteen`

## Key Talking Points

- Hermes is the user-facing agent.
- MCP is the tool boundary.
- n8n runs retrieval and ingestion logic.
- Neo4j graph RAG supports structured retrieval.
- Neo4j vector RAG supports semantic retrieval.
