import migrationRunner from "node-pg-migrate";
import path from "node:path";
import database from "infra/database.js";

export default async function migrations(request, response) {
  const dbClient = await database.getNewClient();

  const defaultMigrationsOptions = {
    dbClient: dbClient,
    databaseUrl: process.env.DATABASE_URL,
    dryRun: true,
    dir: path.join("infra", "migrations"),
    direction: "up",
    verbose: true,
    migrationsTable: "pgmigrations",
  };
  if (request.method === "GET") {
    const pendingMigrations = await migrationRunner(defaultMigrationsOptions);
    await dbClient.end();
    response.status(200).json(pendingMigrations);
  }

  if (request.method === "POST") {
    const migratedMigrations = await migrationRunner({
      ...defaultMigrationsOptions,
      dryRun: false,
    });

    await dbClient.end();

    if (migratedMigrations.length > 0) {
      response.status(201).json(migratedMigrations);
    }

    response.status(200).json(migratedMigrations);
  }

  return response.status(405).end();
}
