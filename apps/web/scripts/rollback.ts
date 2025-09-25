#!/usr/bin/env tsx

import postgres, { PostgresError } from "postgres";
import fs from "fs";
import path from "path";

// Database connection
const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString, {
  prepare: false,
  ssl: "require",
});

interface MigrationRecord {
  id: number;
  hash: string;
  created_at: number;
}

interface JournalEntry {
  tag: string;
  when: number;
  idx: number;
}

async function getCurrentMigration(): Promise<MigrationRecord | null> {
  try {
    const result = await client`
      SELECT id, hash, created_at 
      FROM drizzle.__drizzle_migrations 
      ORDER BY created_at DESC 
      LIMIT 1
    `;
    console.log("🔍 Found migration records in DB:", result);
    return (result[0] as MigrationRecord) || null;
  } catch (e) {
    if (e instanceof PostgresError && e.code === "42P01") {
      console.log(
        "ℹ️  Could not find 'drizzle.__drizzle_migrations' table. Assuming no migrations have been applied.",
      );
      return null;
    }
    console.error("❌ Error fetching current migration:", e);
    return null;
  }
}

async function findMigrationFolder(hash: string): Promise<string | null> {
  // Read the Drizzle journal to find the tag that corresponds to this migration
  // We need to match by timestamp since the DB hash and journal tag are different
  const journalPath = path.join(
    process.cwd(),
    "drizzle",
    "migrations",
    "meta",
    "_journal.json",
  );

  if (!fs.existsSync(journalPath)) {
    console.error("❌ Could not find Drizzle journal file");
    return null;
  }

  // First, get the migration record from DB to get its timestamp
  const migrationRecord = await client`
    SELECT created_at FROM drizzle.__drizzle_migrations WHERE hash = ${hash}
  `;

  if (!migrationRecord[0]) {
    console.error(`❌ Could not find migration record for hash: ${hash}`);
    return null;
  }

  const timestamp = parseInt(migrationRecord[0].created_at);

  const journal = JSON.parse(fs.readFileSync(journalPath, "utf8"));
  const entry = journal.entries?.find(
    (e: JournalEntry) => e.when === timestamp,
  );

  if (!entry) {
    console.error(
      `❌ Could not find migration entry for timestamp: ${timestamp}`,
    );
    return null;
  }

  console.log(`🔍 Found migration: ${entry.tag} (timestamp: ${timestamp})`);

  const migrationPath = path.join(
    process.cwd(),
    "drizzle",
    "migrations",
    entry.tag,
  );

  if (fs.existsSync(migrationPath)) {
    return migrationPath;
  }

  console.error(`❌ Migration folder not found for tag: ${entry.tag}`);
  return null;
}

async function executeDownMigration(migrationPath: string): Promise<boolean> {
  const downFilePath = path.join(migrationPath, "down.sql");

  if (!fs.existsSync(downFilePath)) {
    console.error(`❌ Down migration file not found: ${downFilePath}`);
    console.log("💡 Create a down.sql file manually to enable rollback");
    return false;
  }

  const downSQL = fs.readFileSync(downFilePath, "utf8").trim();

  if (!downSQL) {
    console.error("❌ Down migration file is empty");
    return false;
  }

  try {
    console.log(`🔄 Executing down migration...`);
    console.log(`📄 SQL: ${downSQL}`);

    await client.unsafe(downSQL);
    console.log("✅ Down migration executed successfully");
    return true;
  } catch (error) {
    console.error("❌ Error executing down migration:", error);
    return false;
  }
}

async function removeMigrationRecord(hash: string): Promise<void> {
  try {
    await client`
      DELETE FROM drizzle.__drizzle_migrations 
      WHERE hash = ${hash}
    `;
    console.log("🗑️  Migration record removed from database");
  } catch (error) {
    console.error("Error removing migration record:", error);
  }
}

async function rollback(): Promise<void> {
  console.log("🔄 Starting rollback process...");

  const currentMigration = await getCurrentMigration();

  if (!currentMigration) {
    console.log(
      "✅ No applied migrations found in the database. Nothing to roll back.",
    );
    return;
  }

  console.log(`📋 Current migration tag: ${currentMigration.hash}`);

  const migrationPath = await findMigrationFolder(currentMigration.hash);

  if (!migrationPath) {
    console.error("❌ Could not find migration folder. Rollback failed.");
    process.exit(1);
    return;
  }

  console.log(`📁 Found migration folder: ${migrationPath}`);

  const success = await executeDownMigration(migrationPath);

  if (success) {
    await removeMigrationRecord(currentMigration.hash);
    console.log("🎉 Rollback completed successfully!");
  } else {
    console.error("❌ Rollback failed");
    process.exit(1);
  }
}

// Run rollback
rollback()
  .catch(console.error)
  .finally(() => client.end());
