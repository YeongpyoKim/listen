const { createClient } = require('@libsql/client');

/**
 * Shared Database Client for Vercel Serverless Functions using Turso (LibSQL).
 * Environment variables required:
 * - TURSO_DATABASE_URL: The URL of the Turso database.
 * - TURSO_AUTH_TOKEN: The authentication token for the Turso database.
 */

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

module.exports = {
  client,
  // Helper to execute a query and return results as an array of objects
  query: async (sql, params = []) => {
    const result = await client.execute(sql, { args: params });
    return result.rows;
  },
  // Helper for single row retrieval
  getRow: async (sql, params = []) => {
    const rows = await client.execute(sql, { args: params });
    return rows.rows[0];
  },
  // Helper for execute-and-forget or update/delete
  execute: async (sql, params = []) => {
    return await client.execute(sql, { args: params });
  }
};
