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

    await db.query(
        `CREATE TABLE IF NOT EXISTS giveaways (
            id SERIAL PRIMARY KEY NOT NULL,
            title VARCHAR(128) NOT NULL,
            description VARCHAR(1024) NOT NULL,
            channel_id VARCHAR(32),
            message_id VARCHAR(32),
            duration INTEGER NOT NULL,
            end_date TIMESTAMP,
            cooldown INTEGER NOT NULL DEFAULT 1,
            max_tickets INTEGER NOT NULL DEFAULT 1,
            posted BOOLEAN NOT NULL DEFAULT FALSE
        )`
    );

    await db.query(
        `CREATE TABLE IF NOT EXISTS giveaway_access (
            id INTEGER REFERENCES giveaways(id) ON DELETE CASCADE,
            snowflake VARCHAR(32),
            PRIMARY KEY (id, snowflake)
        )`
    );

    await db.query(
        `CREATE TABLE IF NOT EXISTS giveaway_entrants (
            id INTEGER REFERENCES giveaways(id) ON DELETE CASCADE,
            user_id VARCHAR(32) NOT NULL,
            last_entered TIMESTAMP NOT NULL DEFAULT '1970-1-1',
            tickets INTEGER NOT NULL DEFAULT 0,
            PRIMARY KEY (id, user_id)
        )`
    );

    await db.query(
        `CREATE TABLE IF NOT EXISTS giveaway_weights (
            id INTEGER REFERENCES giveaways(id) ON DELETE CASCADE,
            snowflake VARCHAR(32),
            weight FLOAT NOT NULL,
            PRIMARY KEY (id, snowflake)
        )`
    );

    process.exit();
})();
