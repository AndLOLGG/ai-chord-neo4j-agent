import dotenv from "dotenv";

dotenv.config();

const {
  OPENAI_API_KEY,
  NEO4J_HTTP_URL,
  NEO4J_USERNAME,
  NEO4J_PASSWORD,
  OPENAI_EMBEDDING_MODEL = "text-embedding-3-small",
} = process.env;

const requiredVars = [
  "OPENAI_API_KEY",
  "NEO4J_HTTP_URL",
  "NEO4J_USERNAME",
  "NEO4J_PASSWORD",
];

const missingVars = requiredVars.filter((name) => !process.env[name]);

if (missingVars.length > 0) {
  console.error(
    `Missing required environment variables: ${missingVars.join(", ")}`
  );
  process.exit(1);
}

function toNeo4jAuthHeader(username, password) {
  return `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
}

async function runNeo4jQuery(statement, parameters = {}) {
  const response = await fetch(NEO4J_HTTP_URL, {
    method: "POST",
    headers: {
      Authorization: toNeo4jAuthHeader(NEO4J_USERNAME, NEO4J_PASSWORD),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      statement,
      parameters,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Neo4j HTTP ${response.status}: ${body}`);
  }

  const json = await response.json();
  return json;
}

async function createEmbedding(input) {
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENAI_EMBEDDING_MODEL,
      input,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenAI HTTP ${response.status}: ${body}`);
  }

  const json = await response.json();
  return json.data[0]?.embedding;
}

function buildSongText(song) {
  const parts = [
    `Title: ${song.title ?? ""}`,
    `Artist: ${song.artist ?? ""}`,
    `Summary: ${song.summary ?? ""}`,
  ];

  return parts.join("\n").trim();
}

function mapRow(columns, row) {
  const mapped = {};

  columns.forEach((column, index) => {
    mapped[column] = row[index];
  });

  return mapped;
}

function getNeo4jRows(result) {
  const columns = result.data?.fields || [];
  const values = result.data?.values || [];

  return values.map((row) => mapRow(columns, row));
}

async function fetchSongsNeedingEmbeddings() {
  const result = await runNeo4jQuery(
    `
    MATCH (s:Song)-[:BY_ARTIST]->(a:Artist)
    WHERE s.embedding IS NULL
    RETURN s.id AS id, s.title AS title, a.name AS artist, s.summary AS summary
    ORDER BY a.name, s.title
    `
  );

  return getNeo4jRows(result);
}

async function storeEmbedding(songId, embedding) {
  const result = await runNeo4jQuery(
    `
    MATCH (s:Song {id: $id})
    SET s.embedding = $embedding
    RETURN s.id
    `,
    {
      id: songId,
      embedding,
    }
  );

  const rows = getNeo4jRows(result);

  if (rows.length === 0) {
    throw new Error(`No Song node was updated for id ${songId}`);
  }
}

async function main() {
  const songs = await fetchSongsNeedingEmbeddings();

  if (songs.length === 0) {
    console.log("No songs without embeddings were found.");
    return;
  }

  console.log(`Found ${songs.length} songs without embeddings.`);

  for (let index = 0; index < songs.length; index += 1) {
    const song = songs[index];
    const label = `${song.title} - ${song.artist}`;
    const text = buildSongText(song);

    console.log(`[${index + 1}/${songs.length}] Embedding ${label}`);

    const embedding = await createEmbedding(text);

    if (!embedding) {
      throw new Error(`No embedding returned for ${label}`);
    }

    await storeEmbedding(song.id, embedding);
  }

  console.log("Finished storing embeddings on Song nodes.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
