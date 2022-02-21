import { db } from "./db_client.js";

var xp_role_cache;
var xp_channel_block_cache;

export async function add_xp_role(role_id) {
    await db.query(
        `INSERT INTO xp (
            role_id
        ) VALUES ($1) ON CONFLICT (
            role_id
        ) DO UPDATE SET xp = xp.xp`,
        [role_id]
    );
    if (xp_role_cache) xp_role_cache.add(role_id);
}

export async function rm_xp_role(role_id) {
    await db.query(`DELETE FROM xp WHERE role_id = $1`, [role_id]);
    if (xp_role_cache) xp_role_cache.delete(role_id);
}

export async function clear_xp_roles() {
    await db.query(`DELETE FROM xp`);
    if (xp_role_cache) xp_role_cache.clear();
}

export async function increase_xp(role_id, xp) {
    await db.query(`UPDATE xp SET xp = xp + $1 WHERE role_id = $2`, [
        xp,
        role_id,
    ]);
}

export async function list_xp_roles() {
    if (xp_role_cache) return xp_role_cache;
    return (xp_role_cache = new Set(
        (await db.query(`SELECT role_id FROM xp`)).rows.map(
            (entry) => entry.role_id
        )
    ));
}

export async function increase_user_xp(user_id, xp) {
    await db.query(
        `INSERT INTO user_xp (
            user_id, xp
        ) VALUES ($1, $2) ON CONFLICT (
            user_id
        ) DO UPDATE SET xp = user_xp.xp + $2`,
        [user_id, xp]
    );
}

export async function get_user_xp(user_id) {
    return (
        (await db.query(`SELECT xp FROM user_xp WHERE user_id = $1`, [user_id]))
            .rows[0] || { xp: 0 }
    ).xp;
}

export async function reset_user_xp() {
    await db.query(`DELETE FROM user_xp`);
}

export async function top_10_user_xp() {
    return (await db.query(`SELECT * FROM user_xp ORDER BY xp DESC LIMIT 10`))
        .rows;
}

export async function leaderboard() {
    return (await db.query(`SELECT * FROM xp`)).rows;
}

export async function block_channel_xp(channel_id) {
    await db.query(
        `INSERT INTO no_xp_channels (
            channel_id
        ) VALUES ($1) ON CONFLICT (
            channel_id
        ) DO UPDATE SET channel_id = no_xp_channels.channel_id`,
        [channel_id]
    );
    if (xp_channel_block_cache) xp_channel_block_cache.add(channel_id);
}

export async function unblock_channel_xp(channel_id) {
    await db.query(`DELETE FROM no_xp_channels WHERE channel_id = $1`, [
        channel_id,
    ]);
    if (xp_channel_block_cache) xp_channel_block_cache.delete(channel_id);
}

export async function list_xp_blocked_channels() {
    if (xp_channel_block_cache) return xp_channel_block_cache;
    return (xp_channel_block_cache = new Set(
        (await db.query(`SELECT channel_id FROM no_xp_channels`)).rows.map(
            (entry) => entry.channel_id
        )
    ));
}

export async function set_money(user_id, money) {
    await db.query(
        `INSERT INTO economy (
            user_id, money
        ) VALUES ($1, $2) ON CONFLICT (
            user_id
        ) DO UPDATE SET money = $2`,
        [user_id, money]
    );
}

export async function add_money(user_id, money) {
    await db.query(
        `INSERT INTO economy (
            user_id, money
        ) VALUES ($1, $2) ON CONFLICT (
            user_id
        ) DO UPDATE SET money = economy.money + $2`,
        [user_id, money]
    );
}

export async function get_money(user_id) {
    return (
        (
            await db.query(`SELECT money FROM economy WHERE user_id = $1`, [
                user_id,
            ])
        ).rows[0] || { money: 0 }
    ).money;
}

export async function economy(page) {
    return (
        await db.query(
            `SELECT * FROM economy ORDER BY money DESC LIMIT 10 OFFSET $1`,
            [((page || 1) - 1) * 10]
        )
    ).rows;
}
