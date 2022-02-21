import { db } from "./db_client.js";

(async () => {
    await db.connect();

    await db.query(
        `CREATE TABLE IF NOT EXISTS xp (
            role_id VARCHAR(32) PRIMARY KEY NOT NULL,
            xp FLOAT DEFAULT 0
        )`
    );

    await db.query(
        `CREATE TABLE IF NOT EXISTS user_xp (
            user_id VARCHAR(32) PRIMARY KEY NOT NULL,
            xp FLOAT DEFAULT 0
        )`
    );

    await db.query(
        `CREATE TABLE IF NOT EXISTS no_xp_channels (
            channel_id VARCHAR(32) PRIMARY KEY NOT NULL
        )`
    );

    await db.query(
        `CREATE TABLE IF NOT EXISTS economy (
            user_id VARCHAR(32) PRIMARY KEY NOT NULL,
            money INTEGER DEFAULT 0
        )`
    );

    process.exit();
})();
