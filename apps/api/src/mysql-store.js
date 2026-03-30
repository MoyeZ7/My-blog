import mysql from "mysql2/promise";

function createConfig() {
  const storageMode = process.env.MY_BLOG_STORAGE ?? "file";
  const password = process.env.MY_BLOG_DB_PASSWORD ?? "";

  if (storageMode === "mysql" && !password) {
    throw new Error("Missing MY_BLOG_DB_PASSWORD for mysql storage mode");
  }

  return {
    host: process.env.MY_BLOG_DB_HOST ?? "127.0.0.1",
    port: Number(process.env.MY_BLOG_DB_PORT ?? 3306),
    user: process.env.MY_BLOG_DB_USER ?? "root",
    password,
    database: process.env.MY_BLOG_DB_NAME ?? "my_blog",
    storageMode
  };
}

let pool;

function getPool(config = createConfig()) {
  if (!pool) {
    pool = mysql.createPool({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      waitForConnections: true,
      connectionLimit: 10,
      namedPlaceholders: true
    });
  }

  return pool;
}

export function shouldUseMySqlStorage() {
  return createConfig().storageMode === "mysql";
}

async function ensureDatabase(config) {
  const connection = await mysql.createConnection({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password
  });

  try {
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${config.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
  } finally {
    await connection.end();
  }
}

async function ensureTables(activePool) {
  await activePool.query(`
    CREATE TABLE IF NOT EXISTS content_documents (
      name VARCHAR(64) PRIMARY KEY,
      body JSON NOT NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
}

async function upsertDocument(activePool, name, body) {
  await activePool.query(
    `
      INSERT INTO content_documents (name, body)
      VALUES (?, CAST(? AS JSON))
      ON DUPLICATE KEY UPDATE
        body = VALUES(body),
        updated_at = CURRENT_TIMESTAMP
    `,
    [name, JSON.stringify(body)]
  );
}

export async function initializeMySqlStorage(seedSnapshot) {
  const config = createConfig();

  if (config.storageMode !== "mysql") {
    return null;
  }

  await ensureDatabase(config);

  const activePool = getPool(config);
  await ensureTables(activePool);

  const [rows] = await activePool.query("SELECT name, body FROM content_documents");

  if (!rows.length) {
    await persistContentSnapshotToMySql(seedSnapshot);
    return seedSnapshot;
  }

  return {
    posts: rows.find((row) => row.name === "posts")?.body ?? seedSnapshot.posts,
    comments: rows.find((row) => row.name === "comments")?.body ?? seedSnapshot.comments,
    siteConfig: rows.find((row) => row.name === "siteConfig")?.body ?? seedSnapshot.siteConfig
  };
}

export async function persistContentSnapshotToMySql(snapshot) {
  const config = createConfig();

  if (config.storageMode !== "mysql") {
    return;
  }

  await ensureDatabase(config);

  const activePool = getPool(config);
  await ensureTables(activePool);

  await upsertDocument(activePool, "posts", snapshot.posts);
  await upsertDocument(activePool, "comments", snapshot.comments);
  await upsertDocument(activePool, "siteConfig", snapshot.siteConfig);
}

export function getMySqlStorageConfig() {
  return createConfig();
}
