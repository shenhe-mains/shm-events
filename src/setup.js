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
        `CREATE TABLE IF NOT EXISTS economy_changes (
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

    await db.query(
        `CREATE TABLE IF NOT EXISTS shop_purchases (
            name VARCHAR(128) NOT NULL,
            user_id VARCHAR(32) NOT NULL,
            owned INTEGER NOT NULL DEFAULT 0,
            last_purchase TIMESTAMP NOT NULL DEFAULT '1970-1-1',
            PRIMARY KEY (name, user_id)
        )`
    );

    await db.query(
        `CREATE TABLE IF NOT EXISTS salaries (
            user_id VARCHAR(32) PRIMARY KEY NOT NULL,
            last TIMESTAMP NOT NULL DEFAULT '1970-1-1'
        )`
    );

    await db.query(
        `CREATE TABLE IF NOT EXISTS random_events (
            channel_id VARCHAR(32) NOT NULL,
            type VARCHAR(16) NOT NULL,
            last TIMESTAMP NOT NULL DEFAULT '1970-1-1',
            min_period INTEGER NOT NULL,
            max_period INTEGER NOT NULL,
            activity_scaling INTEGER NOT NULL,
            PRIMARY KEY (channel_id, type)
        )`
    );

    await db.query(
        `CREATE TABLE IF NOT EXISTS trivia_questions (
            id SERIAL PRIMARY KEY,
            question VARCHAR(512) NOT NULL,
            image VARCHAR(512)
        )`
    );

    await db.query(
        `CREATE TABLE IF NOT EXISTS trivia_answers (
            id INTEGER REFERENCES trivia_questions(id) ON DELETE CASCADE,
            answer VARCHAR(128) NOT NULL
        )`
    );

    await db.query(
        `CREATE TABLE IF NOT EXISTS autoreject (
            user_id VARCHAR(32) NOT NULL,
            type VARCHAR(16) NOT NULL,
            PRIMARY KEY (user_id, type)
        )`
    );

    process.exit();
})();
